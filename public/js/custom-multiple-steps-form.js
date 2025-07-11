var multipleStepsFormObj = (function() {
  /** This Document needs Jquery library to be loaded **/

  var currentTab = 0; // Current tab is set to be the first tab (0)

  showTab(currentTab); // Display the current tab

  var nextBtnState = {
    currentTab: 0,
    disabled: false
  };

  function showTab(n) {
    // This function will display the specified tab of the form ...
    var x = document.querySelectorAll('.multi-steps .tab');
    // console.log('x: ', x);
    // console.log(`x[${n}]`, x[n]);
    x[n].classList.add('current-tab');
    // ... and fix the Previous/Next buttons:
    if (n == 0) {
      document.querySelector('.multi-steps #prevBtn').style.display = 'none';
    } else {
      document.querySelector('.multi-steps #prevBtn').style.display = 'inline';
    }
    if (n == x.length - 1) {
      document.querySelector('.multi-steps #nextBtn').innerHTML = 'Submit';
    } else {
      document.querySelector('.multi-steps #nextBtn').innerHTML = 'Next &raquo;';
    }
    // ... and run a function that displays the correct step indicator:
    fixStepIndicator(n);
  }

  function nextPrev(n) {
    // This function will figure out which tab to display
    var x = document.querySelectorAll('.multi-steps .tab');
    // Exit the function if any field in the current tab is invalid:
    if (n == 1 && !validateForm()) return false;
    // Hide the current tab:
    x[currentTab].classList.remove('current-tab');
    // Increase or decrease the current tab by 1:
    currentTab = currentTab + n;
    if (n > 0) {
      if (currentTab === nextBtnState.currentTab) {
        document.querySelector('.multi-steps #nextBtn').disabled = nextBtnState.disabled; // return to stored state
      } else {
        document.querySelector('.multi-steps #nextBtn').disabled = false;
      }
    }
    // enable next btn if n < 1
    if (n < 0) {
      nextBtnState.currentTab = currentTab - n; // store previous tab store at this tab
      nextBtnState.disabled = document.querySelector('.multi-steps #nextBtn').disabled;
      document.querySelector('.multi-steps #nextBtn').disabled = false;
    }
    if (currentTab >= x.length) {
      // if you have reached the end of the form... :
      //...the form gets submitted:
      if (typeof submitForm !== undefined) {
        submitFom();

        var prevBtn = document.querySelector('.multi-steps #prevBtn');
        prevBtn.parentNode.removeChild(prevBtn);
        document.querySelector('.multi-steps #nextBtn').disabled = true;
      } else {
        console.log('You need to implement a submitForm function');
      }
      return false;
    }
    // Otherwise, display the correct tab:
    showTab(currentTab);
    // Scroll to the top of the page
    $('.modal').animate(
      {
        scrollTop: 0
      },
      500
    );
  }

  function zeroTab() {
    var x = document.querySelectorAll('.multi-steps .tab');
    x[currentTab].classList.remove('current-tab');
    currentTab = 0;
    // Otherwise, display the correct tab:
    showTab(currentTab);
  }

  function validateForm() {
    // This function deals with validation of the form fields
    var x,
      y,
      i,
      valid = true;
    x = document.querySelectorAll('.multi-steps .tab');
    y = x[currentTab].querySelectorAll('.multi-steps [required]');
    // A loop that checks every required field in the current tab:
    for (i = 0; i < y.length; i++) {
      // If a field is empty...
      if (y[i].value == '') {
        // add an "invalid" class to the field:
        y[i].className += ' invalid';
        // and set the current valid status to false:
        valid = false;
      }
    }
    // If the valid status is true, mark the step as finished and valid:
    if (valid) {
      document.querySelectorAll('.multi-steps .step')[currentTab].className += ' finish';
    }
    return valid; // return the valid status
  }

  function fixStepIndicator(n) {
    // This function removes the "active" class of all steps...
    var i,
      x = document.querySelectorAll('.multi-steps .step');
    for (i = 0; i < x.length; i++) {
      x[i].className = x[i].className.replace(' active', '');
    }
    //... and adds the "active" class to the current step:
    x[n].className += ' active';
  }
  return { nextPrev: nextPrev, zeroTab: zeroTab };
})();

var nextPrev = multipleStepsFormObj.nextPrev;
var zeroTab = multipleStepsFormObj.zeroTab;
