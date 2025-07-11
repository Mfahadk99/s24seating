/*! Checkboxes 1.2.10
 *  Copyright (c) Gyrocode (www.gyrocode.com)
 *  License: MIT License
 */
(function(factory) {
  if (typeof define === 'function' && define.amd) {
    define(['jquery', 'datatables.net'], function($) {
      return factory($, window, document);
    });
  } else {
    if (typeof exports === 'object') {
      module.exports = function(root, $) {
        if (!root) {
          root = window;
        }
        if (!$ || !$.fn.dataTable) {
          $ = require('datatables.net')(root, $).$;
        }
        return factory($, root, root.document);
      };
    } else {
      factory(jQuery, window, document);
    }
  }
})(function($, window, document) {
  var DataTable = $.fn.dataTable;
  var Checkboxes = function(settings) {
    if (!DataTable.versionCheck || !DataTable.versionCheck('1.10.8')) {
      throw 'DataTables Checkboxes requires DataTables 1.10.8 or newer';
    }
    this.s = {
      dt: new DataTable.Api(settings),
      columns: [],
      data: [],
      dataDisabled: [],
      ignoreSelect: false
    };
    this.s.ctx = this.s.dt.settings()[0];
    if (this.s.ctx.checkboxes) {
      return;
    }
    settings.checkboxes = this;
    this._constructor();
  };
  Checkboxes.prototype = {
    _constructor: function() {
      var self = this;
      var dt = self.s.dt;
      var ctx = self.s.ctx;
      var hasCheckboxes = false;
      var hasCheckboxesSelectRow = false;
      var state = dt.state.loaded();
      for (var i = 0; i < ctx.aoColumns.length; i++) {
        if (ctx.aoColumns[i].checkboxes) {
          var $colHeader = $(dt.column(i).header());
          hasCheckboxes = true;
          if (!$.isPlainObject(ctx.aoColumns[i].checkboxes)) {
            ctx.aoColumns[i].checkboxes = {};
          }
          ctx.aoColumns[i].checkboxes = $.extend({}, Checkboxes.defaults, ctx.aoColumns[i].checkboxes);
          var colOptions = {
            searchable: false,
            orderable: false
          };
          if (ctx.aoColumns[i].sClass === '') {
            colOptions['className'] = 'dt-checkboxes-cell';
          } else {
            colOptions['className'] = ctx.aoColumns[i].sClass + ' dt-checkboxes-cell';
          }
          if (ctx.aoColumns[i].sWidthOrig === null) {
            colOptions['width'] = '1%';
          }
          if (ctx.aoColumns[i].mRender === null) {
            colOptions['render'] = function() {
              return '<input type="checkbox" class="dt-checkboxes">';
            };
          }
          DataTable.ext.internal._fnColumnOptions(ctx, i, colOptions);
          $colHeader.removeClass('sorting');
          $colHeader.off('.dt');
          if (ctx.sAjaxSource === null) {
            var cells = dt.cells('tr', i);
            cells.invalidate('data');
            $(cells.nodes()).addClass(colOptions['className']);
          }
          self.s.data[i] = {};
          self.s.dataDisabled[i] = {};
          if (state && state.checkboxes && state.checkboxes.hasOwnProperty(i)) {
            if (ctx.aoColumns[i].checkboxes.stateSave) {
              self.s.data[i] = state.checkboxes[i];
            }
          }
          self.s.columns.push(i);
          if (ctx.aoColumns[i].checkboxes.selectRow) {
            if (ctx._select) {
              hasCheckboxesSelectRow = true;
            } else {
              ctx.aoColumns[i].checkboxes.selectRow = false;
            }
          }
          if (ctx.aoColumns[i].checkboxes.selectAll) {
            $colHeader.data('html', $colHeader.html());
            if (ctx.aoColumns[i].checkboxes.selectAllRender !== null) {
              var selectAllHtml = '';
              if ($.isFunction(ctx.aoColumns[i].checkboxes.selectAllRender)) {
                selectAllHtml = ctx.aoColumns[i].checkboxes.selectAllRender();
              } else {
                if (typeof ctx.aoColumns[i].checkboxes.selectAllRender === 'string') {
                  selectAllHtml = ctx.aoColumns[i].checkboxes.selectAllRender;
                }
              }
              $colHeader
                .html(selectAllHtml)
                .addClass('dt-checkboxes-select-all')
                .attr('data-col', i);
            }
          }
        }
      }
      if (hasCheckboxes) {
        var $table = $(dt.table().node());
        var $tableBody = $(dt.table().body());
        var $tableContainer = $(dt.table().container());
        if (hasCheckboxesSelectRow) {
          $table.addClass('dt-checkboxes-select');
          $table.on('user-select.dt.dtCheckboxes', function(e, dt, type, cell) {
            var cellIdx = cell.index();
            var rowIdx = cellIdx.row;
            var colIdx = self.getSelectRowColIndex();
            var cellData = dt
              .cell({
                row: rowIdx,
                column: colIdx
              })
              .data();
            if (!self.isCellSelectable(colIdx, cellData)) {
              e.preventDefault();
            }
          });
          $table.on('select.dt.dtCheckboxes deselect.dt.dtCheckboxes', function(e, api, type, indexes) {
            self.onSelect(e, type, indexes);
          });
          dt.select.info(false);
          $table.on('draw.dt.dtCheckboxes select.dt.dtCheckboxes deselect.dt.dtCheckboxes', function() {
            self.showInfoSelected();
          });
        }
        $table.on('draw.dt.dtCheckboxes', function(e) {
          self.onDraw(e);
        });
        $tableBody.on('click.dtCheckboxes', 'input.dt-checkboxes', function(e) {
          self.onClick(e, this);
        });
        $tableContainer.on('click.dtCheckboxes', 'thead th.dt-checkboxes-select-all input[type="checkbox"]', function(
          e
        ) {
          self.onClickSelectAll(e, this);
        });
        $tableContainer.on('click.dtCheckboxes', 'thead th.dt-checkboxes-select-all', function() {
          $('input[type="checkbox"]', this)
            .not(':disabled')
            .trigger('click');
        });
        if (!hasCheckboxesSelectRow) {
          $tableContainer.on('click.dtCheckboxes', 'tbody td.dt-checkboxes-cell', function() {
            $('input[type="checkbox"]', this)
              .not(':disabled')
              .trigger('click');
          });
        }
        $tableContainer.on(
          'click.dtCheckboxes',
          'thead th.dt-checkboxes-select-all label, tbody td.dt-checkboxes-cell label',
          function(e) {
            e.preventDefault();
          }
        );
        $(document).on(
          'click.dtCheckboxes',
          '.fixedHeader-floating thead th.dt-checkboxes-select-all input[type="checkbox"]',
          function(e) {
            if (ctx._fixedHeader) {
              if (ctx._fixedHeader.dom['header'].floating) {
                self.onClickSelectAll(e, this);
              }
            }
          }
        );
        $(document).on('click.dtCheckboxes', '.fixedHeader-floating thead th.dt-checkboxes-select-all', function() {
          if (ctx._fixedHeader) {
            if (ctx._fixedHeader.dom['header'].floating) {
              $('input[type="checkbox"]', this).trigger('click');
            }
          }
        });
        $table.on('init.dt.dtCheckboxes', function() {
          if (!ctx.oFeatures.bServerSide) {
            if (ctx.oFeatures.bStateSave) {
              self.updateState();
            }
            $table.on('xhr.dt.dtCheckboxes', function() {
              $.each(self.s.columns, function(index, colIdx) {
                self.s.data[colIdx] = {};
                self.s.dataDisabled[colIdx] = {};
              });
              if (ctx.oFeatures.bStateSave) {
                var state = dt.state.loaded();
                $.each(self.s.columns, function(index, colIdx) {
                  if (state && state.checkboxes && state.checkboxes.hasOwnProperty(colIdx)) {
                    if (ctx.aoColumns[colIdx].checkboxes.stateSave) {
                      self.s.data[colIdx] = state.checkboxes[colIdx];
                    }
                  }
                });
                $table.one('draw.dt.dtCheckboxes', function() {
                  self.updateState();
                });
              }
            });
          }
          if (ctx.oFeatures.bStateSave) {
            $table.on('stateSaveParams.dt.dtCheckboxes', function(e, settings, data) {
              data.checkboxes = [];
              $.each(self.s.columns, function(index, colIdx) {
                if (ctx.aoColumns[colIdx].checkboxes.stateSave) {
                  data.checkboxes[colIdx] = self.s.data[colIdx];
                }
              });
            });
          }
        });
        $table.one('destroy.dt.dtCheckboxes', function() {
          $(document).off('click.dtCheckboxes');
          $tableContainer.on('.dtCheckboxes');
          $tableBody.off('.dtCheckboxes');
          $table.off('.dtCheckboxes');
          self.s.data = {};
          self.s.dataDisabled = {};
          $('.dt-checkboxes-select-all', $table).each(function(index, el) {
            $(el)
              .html($(el).data('html'))
              .removeClass('dt-checkboxes-select-all');
          });
        });
      }
    },
    updateData: function(cells, colIdx, isSelected) {
      var self = this;
      var dt = self.s.dt;
      var ctx = self.s.ctx;
      if (ctx.aoColumns[colIdx].checkboxes) {
        var cellsData = cells.data();
        cellsData.each(function(cellData) {
          if (isSelected) {
            ctx.checkboxes.s.data[colIdx][cellData] = 1;
          } else {
            delete ctx.checkboxes.s.data[colIdx][cellData];
          }
        });
        if (ctx.oFeatures.bStateSave) {
          if (ctx.aoColumns[colIdx].checkboxes.stateSave) {
            dt.state.save();
          }
        }
      }
    },
    updateSelect: function(selector, isSelected) {
      var self = this;
      var dt = self.s.dt;
      var ctx = self.s.ctx;
      if (ctx._select) {
        self.s.ignoreSelect = true;
        if (isSelected) {
          dt.rows(selector).select();
        } else {
          dt.rows(selector).deselect();
        }
        self.s.ignoreSelect = false;
      }
    },
    updateCheckbox: function(cells, colIdx, isSelected) {
      var self = this;
      var ctx = self.s.ctx;
      var cellNodes = cells.nodes();
      if (cellNodes.length) {
        $('input.dt-checkboxes', cellNodes)
          .not(':disabled')
          .prop('checked', isSelected);
        if ($.isFunction(ctx.aoColumns[colIdx].checkboxes.selectCallback)) {
          ctx.aoColumns[colIdx].checkboxes.selectCallback(cellNodes, isSelected);
        }
      }
    },
    updateState: function() {
      var self = this;
      self.updateStateCheckboxes({
        page: 'all',
        search: 'none'
      });
      $.each(self.s.columns, function(index, colIdx) {
        self.updateSelectAll(colIdx);
      });
    },
    updateStateCheckboxes: function(opts) {
      var self = this;
      var dt = self.s.dt;
      var ctx = self.s.ctx;
      dt.cells('tr', self.s.columns, opts).every(function(rowIdx, colIdx) {
        var cellData = this.data();
        var isCellSelectable = self.isCellSelectable(colIdx, cellData);
        if (ctx.checkboxes.s.data[colIdx].hasOwnProperty(cellData)) {
          self.updateCheckbox(this, colIdx, true);
          if (ctx.aoColumns[colIdx].checkboxes.selectRow && isCellSelectable) {
            self.updateSelect(rowIdx, true);
          }
        }
        if (!isCellSelectable) {
          $('input.dt-checkboxes', this.node()).prop('disabled', true);
        }
      });
    },
    onClick: function(e, ctrl) {
      var self = this;
      var dt = self.s.dt;
      var ctx = self.s.ctx;
      var cellSelector;
      var $cell = $(ctrl).closest('td');
      if ($cell.parents('.DTFC_Cloned').length) {
        cellSelector = dt.fixedColumns().cellIndex($cell);
      } else {
        cellSelector = $cell;
      }
      var cell = dt.cell(cellSelector);
      var cellIdx = cell.index();
      var colIdx = cellIdx.column;
      if (!ctx.aoColumns[colIdx].checkboxes.selectRow) {
        cell.checkboxes.select(ctrl.checked);
        e.stopPropagation();
      } else {
        setTimeout(function() {
          var cellData = cell.data();
          var hasData = self.s.data[colIdx].hasOwnProperty(cellData);
          if (hasData !== ctrl.checked) {
            self.updateCheckbox(cell, colIdx, hasData);
            self.updateSelectAll(colIdx);
          }
        }, 0);
      }
    },
    onSelect: function(e, type, indexes) {
      var self = this;
      var dt = self.s.dt;
      if (self.s.ignoreSelect) {
        return;
      }
      if (type === 'row') {
        var colIdx = self.getSelectRowColIndex();
        if (colIdx !== null) {
          var cells = dt.cells(indexes, colIdx);
          self.updateData(cells, colIdx, e.type === 'select' ? true : false);
          self.updateCheckbox(cells, colIdx, e.type === 'select' ? true : false);
          self.updateSelectAll(colIdx);
        }
      }
    },
    onClickSelectAll: function(e, ctrl) {
      var self = this;
      var dt = self.s.dt;
      var ctx = self.s.ctx;
      var colIdx = null;
      var $th = $(ctrl).closest('th');
      if ($th.parents('.DTFC_Cloned').length) {
        var cellIdx = dt.fixedColumns().cellIndex($th);
        colIdx = cellIdx.column;
      } else {
        colIdx = dt.column($th).index();
      }
      $(ctrl).data('is-changed', true);
      dt.column(colIdx, {
        page: ctx.aoColumns[colIdx].checkboxes && ctx.aoColumns[colIdx].checkboxes.selectAllPages ? 'all' : 'current',
        search: 'applied'
      }).checkboxes.select(ctrl.checked);
      e.stopPropagation();
    },
    onDraw: function() {
      var self = this;
      var ctx = self.s.ctx;
      if (ctx.oFeatures.bServerSide || ctx.oFeatures.bDeferRender) {
        self.updateStateCheckboxes({
          page: 'current',
          search: 'none'
        });
      }
      $.each(self.s.columns, function(index, colIdx) {
        self.updateSelectAll(colIdx);
      });
    },
    updateSelectAll: function(colIdx) {
      var self = this;
      var dt = self.s.dt;
      var ctx = self.s.ctx;
      if (ctx.aoColumns[colIdx].checkboxes && ctx.aoColumns[colIdx].checkboxes.selectAll) {
        var cells = dt.cells('tr', colIdx, {
          page: ctx.aoColumns[colIdx].checkboxes.selectAllPages ? 'all' : 'current',
          search: 'applied'
        });
        var $tableContainer = dt.table().container();
        var $checkboxesSelectAll = $(
          '.dt-checkboxes-select-all[data-col="' + colIdx + '"] input[type="checkbox"]',
          $tableContainer
        );
        var countChecked = 0;
        var countDisabled = 0;
        var cellsData = cells.data();
        $.each(cellsData, function(index, cellData) {
          if (self.isCellSelectable(colIdx, cellData)) {
            if (self.s.data[colIdx].hasOwnProperty(cellData)) {
              countChecked++;
            }
          } else {
            countDisabled++;
          }
        });
        if (ctx._fixedHeader) {
          if (ctx._fixedHeader.dom['header'].floating) {
            $checkboxesSelectAll = $(
              '.fixedHeader-floating .dt-checkboxes-select-all[data-col="' + colIdx + '"] input[type="checkbox"]'
            );
          }
        }
        var isSelected;
        var isIndeterminate;
        if (countChecked === 0) {
          isSelected = false;
          isIndeterminate = false;
        } else {
          if (countChecked + countDisabled === cellsData.length) {
            isSelected = true;
            isIndeterminate = false;
          } else {
            isSelected = true;
            isIndeterminate = true;
          }
        }
        var isChanged = $checkboxesSelectAll.data('is-changed');
        var isSelectedNow = $checkboxesSelectAll.prop('checked');
        var isIndeterminateNow = $checkboxesSelectAll.prop('indeterminate');
        if (isChanged || isSelectedNow !== isSelected || isIndeterminateNow !== isIndeterminate) {
          $checkboxesSelectAll.data('is-changed', false);
          $checkboxesSelectAll.prop({
            checked: isSelected,
            indeterminate: isIndeterminate
          });
          if ($.isFunction(ctx.aoColumns[colIdx].checkboxes.selectAllCallback)) {
            ctx.aoColumns[colIdx].checkboxes.selectAllCallback(
              $checkboxesSelectAll.closest('th').get(0),
              isSelected,
              isIndeterminate
            );
          }
        }
      }
    },
    showInfoSelected: function() {
      var self = this;
      var dt = self.s.dt;
      var ctx = self.s.ctx;
      if (!ctx.aanFeatures.i) {
        return;
      }
      var $output = $('<span class="select-info"/>');
      var add = function(name, num) {
        $output.append(
          $('<span class="select-item"/>').append(
            dt.i18n(
              'select.' + name + 's',
              {
                _: '%d ' + name + 's selected',
                0: '',
                1: '1 ' + name + ' selected'
              },
              num
            )
          )
        );
      };
      var colIdx = self.getSelectRowColIndex();
      if (colIdx !== null) {
        var countRows = 0;
        for (var cellData in ctx.checkboxes.s.data[colIdx]) {
          if (ctx.checkboxes.s.data[colIdx].hasOwnProperty(cellData)) {
            countRows++;
          }
        }
        add('row', countRows);
        $.each(ctx.aanFeatures.i, function(i, el) {
          var $el = $(el);
          var $existing = $el.children('span.select-info');
          if ($existing.length) {
            $existing.remove();
          }
          if ($output.text() !== '') {
            $el.append($output);
          }
        });
      }
    },
    isCellSelectable: function(colIdx, cellData) {
      var self = this;
      var ctx = self.s.ctx;
      if (ctx.checkboxes.s.dataDisabled[colIdx].hasOwnProperty(cellData)) {
        return false;
      } else {
        return true;
      }
    },
    getCellIndex: function(cell) {
      var self = this;
      var dt = self.s.dt;
      var ctx = self.s.ctx;
      if (ctx._oFixedColumns) {
        return dt.fixedColumns().cellIndex(cell);
      } else {
        return dt.cell(cell).index();
      }
    },
    getSelectRowColIndex: function() {
      var self = this;
      var ctx = self.s.ctx;
      var colIdx = null;
      for (var i = 0; i < ctx.aoColumns.length; i++) {
        if (ctx.aoColumns[i].checkboxes && ctx.aoColumns[i].checkboxes.selectRow) {
          colIdx = i;
          break;
        }
      }
      return colIdx;
    },
    updateFixedColumn: function(colIdx) {
      var self = this;
      var dt = self.s.dt;
      var ctx = self.s.ctx;
      if (ctx._oFixedColumns) {
        var leftCols = ctx._oFixedColumns.s.iLeftColumns;
        var rightCols = ctx.aoColumns.length - ctx._oFixedColumns.s.iRightColumns - 1;
        if (colIdx < leftCols || colIdx > rightCols) {
          dt.fixedColumns().update();
        }
      }
    }
  };
  Checkboxes.defaults = {
    stateSave: true,
    selectRow: false,
    selectAll: true,
    selectAllPages: true,
    selectCallback: null,
    selectAllCallback: null,
    selectAllRender: '<input type="checkbox">'
  };
  var Api = $.fn.dataTable.Api;
  Api.register('checkboxes()', function() {
    return this;
  });
  Api.registerPlural('columns().checkboxes.select()', 'column().checkboxes.select()', function(state) {
    if (typeof state === 'undefined') {
      state = true;
    }
    return this.iterator(
      'column-rows',
      function(ctx, colIdx, i, j, rowsIdx) {
        if (ctx.aoColumns[colIdx].checkboxes) {
          var selector = [];
          $.each(rowsIdx, function(index, rowIdx) {
            selector.push({
              row: rowIdx,
              column: colIdx
            });
          });
          var cells = this.cells(selector);
          var cellsData = cells.data();
          var rowsSelectableIdx = [];
          selector = [];
          $.each(cellsData, function(index, cellData) {
            if (ctx.checkboxes.isCellSelectable(colIdx, cellData)) {
              selector.push({
                row: rowsIdx[index],
                column: colIdx
              });
              rowsSelectableIdx.push(rowsIdx[index]);
            }
          });
          cells = this.cells(selector);
          ctx.checkboxes.updateData(cells, colIdx, state);
          ctx.checkboxes.updateCheckbox(cells, colIdx, state);
          if (ctx.aoColumns[colIdx].checkboxes.selectRow) {
            ctx.checkboxes.updateSelect(rowsSelectableIdx, state);
          }
          if (ctx._oFixedColumns) {
            setTimeout(function() {
              ctx.checkboxes.updateSelectAll(colIdx);
            }, 0);
          } else {
            ctx.checkboxes.updateSelectAll(colIdx);
          }
          ctx.checkboxes.updateFixedColumn(colIdx);
        }
      },
      1
    );
  });
  Api.registerPlural('cells().checkboxes.select()', 'cell().checkboxes.select()', function(state) {
    if (typeof state === 'undefined') {
      state = true;
    }
    return this.iterator(
      'cell',
      function(ctx, rowIdx, colIdx) {
        if (ctx.aoColumns[colIdx].checkboxes) {
          var cells = this.cells([
            {
              row: rowIdx,
              column: colIdx
            }
          ]);
          var cellData = this.cell({
            row: rowIdx,
            column: colIdx
          }).data();
          if (ctx.checkboxes.isCellSelectable(colIdx, cellData)) {
            ctx.checkboxes.updateData(cells, colIdx, state);
            ctx.checkboxes.updateCheckbox(cells, colIdx, state);
            if (ctx.aoColumns[colIdx].checkboxes.selectRow) {
              ctx.checkboxes.updateSelect(rowIdx, state);
            }
            if (ctx._oFixedColumns) {
              setTimeout(function() {
                ctx.checkboxes.updateSelectAll(colIdx);
              }, 0);
            } else {
              ctx.checkboxes.updateSelectAll(colIdx);
            }
            ctx.checkboxes.updateFixedColumn(colIdx);
          }
        }
      },
      1
    );
  });
  Api.registerPlural('cells().checkboxes.enable()', 'cell().checkboxes.enable()', function(state) {
    if (typeof state === 'undefined') {
      state = true;
    }
    return this.iterator(
      'cell',
      function(ctx, rowIdx, colIdx) {
        if (ctx.aoColumns[colIdx].checkboxes) {
          var cell = this.cell({
            row: rowIdx,
            column: colIdx
          });
          var cellData = cell.data();
          if (state) {
            delete ctx.checkboxes.s.dataDisabled[colIdx][cellData];
          } else {
            ctx.checkboxes.s.dataDisabled[colIdx][cellData] = 1;
          }
          var cellNode = cell.node();
          if (cellNode) {
            $('input.dt-checkboxes', cellNode).prop('disabled', !state);
          }
          if (ctx.aoColumns[colIdx].checkboxes.selectRow) {
            if (ctx.checkboxes.s.data[colIdx].hasOwnProperty(cellData)) {
              ctx.checkboxes.updateSelect(rowIdx, state);
            }
          }
        }
      },
      1
    );
  });
  Api.registerPlural('cells().checkboxes.disable()', 'cell().checkboxes.disable()', function(state) {
    if (typeof state === 'undefined') {
      state = true;
    }
    return this.checkboxes.enable(!state);
  });
  Api.registerPlural('columns().checkboxes.deselect()', 'column().checkboxes.deselect()', function(state) {
    if (typeof state === 'undefined') {
      state = true;
    }
    return this.checkboxes.select(!state);
  });
  Api.registerPlural('cells().checkboxes.deselect()', 'cell().checkboxes.deselect()', function(state) {
    if (typeof state === 'undefined') {
      state = true;
    }
    return this.checkboxes.select(!state);
  });
  Api.registerPlural('columns().checkboxes.deselectAll()', 'column().checkboxes.deselectAll()', function() {
    return this.iterator(
      'column',
      function(ctx, colIdx) {
        if (ctx.aoColumns[colIdx].checkboxes) {
          ctx.checkboxes.s.data[colIdx] = {};
          this.column(colIdx).checkboxes.select(false);
        }
      },
      1
    );
  });
  Api.registerPlural('columns().checkboxes.selected()', 'column().checkboxes.selected()', function() {
    return this.iterator(
      'column-rows',
      function(ctx, colIdx, i, j, rowsIdx) {
        if (ctx.aoColumns[colIdx].checkboxes) {
          var selector = [];
          $.each(rowsIdx, function(index, rowIdx) {
            selector.push({
              row: rowIdx,
              column: colIdx
            });
          });
          var cells = this.cells(selector);
          var cellsData = cells.data();
          var data = [];
          $.each(cellsData, function(index, cellData) {
            if (ctx.checkboxes.s.data[colIdx].hasOwnProperty(cellData)) {
              if (ctx.checkboxes.isCellSelectable(colIdx, cellData)) {
                data.push(cellData);
              }
            }
          });
          return data;
        } else {
          return [];
        }
      },
      1
    );
  });
  Checkboxes.version = '1.2.10';
  $.fn.DataTable.Checkboxes = Checkboxes;
  $.fn.dataTable.Checkboxes = Checkboxes;
  $(document).on('preInit.dt.dtCheckboxes', function(e, settings) {
    if (e.namespace !== 'dt') {
      return;
    }
    new Checkboxes(settings);
  });
  return Checkboxes;
});
