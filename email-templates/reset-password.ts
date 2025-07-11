export function buildResetPasswordEmailTemplate(
  userId: string,
  host: string,
  token: string
): string {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
  <html xmlns="http://www.w3.org/1999/xhtml">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <link rel="icon" href="${process.env.BASE_URL}/favicon.ico">
      <title>247 Seating</title>
      <style type="text/css">
        .ExternalClass {
          width: 100%;
        }
        .ExternalClass,
        .ExternalClass p,
        .ExternalClass span,
        .ExternalClass font,
        .ExternalClass td,
        .ExternalClass div {
          line-height: 100%;
        }
        body {
          -webkit-text-size-adjust: none;
          -ms-text-size-adjust: none;
        }
        body {
          margin: 0;
          padding: 0;
        }
        table td {
          border-collapse: collapse;
        }
        @media (max-width: 480px) {
          div,
          p,
          a,
          li,
          td {
            -webkit-text-size-adjust: none;
          }
          *[class~=m_hide] {
            display: none !important
          }
          *[class~=m_w70] {
            width: 70px !important
          }
          *[class~=m_w122] {
            width: 122px !important
          }
          *[class~=m_w135] {
            width: 135px !important
          }
          *[class~=m_w150] {
            width: 150px !important
          }
          *[class~=m_w170] {
            width: 170px !important
          }
          *[class~=m_w248] {
            width: 248px !important;
            max-width: 248px !important
          }
          *[class~=m_w280] {
            width: 280px !important;
            max-width: 280px !important
          }
          *[class~=m_w292] {
            width: 292px !important;
            max-width: 292px !important
          }
          *[class~=m_w320] {
            width: 320px !important;
            max-width: 320px !important
          }
          *[class~=m_mw280] {
            max-width: 280px !important
          }
          *[class~=m_mw320] {
            max-width: 320px !important
          }
          *[class~=m_min_w53] {
            min-width: 53px !important
          }
          *[class~=m_min_w280] {
            min-width: 280px !important
          }
          *[class~=m_hauto] {
            height: auto !important
          }
          *[class~=m_h30] {
            height: 30px !important
          }
          *[class~=m_h34] {
            height: 34px !important
          }
          *[class~=m_h40] {
            height: 40px !important
          }
          *[class~=m_h67] {
            height: 67px !important
          }
          *[class~=m_h96] {
            height: 96px !important
          }
          *[class~=m_h135] {
            height: 135px !important
          }
          *[class~=m_h156] {
            height: 156px !important
          }
          *[class~=m_h210] {
            height: 210px !important;
          }
          *[class~=m_wh24] {
            width: 24px !important;
            height: 24px !important
          }
          *[class~=m_wh28] {
            width: 28px !important;
            height: 28px !important
          }
          *[class~=m_wh30] {
            width: 30px !important;
            height: 28px !important
          }
          *[class~=m_wh34] {
            width: 34px !important;
            height: 34px !important
          }
          *[class~=m_wh39] {
            width: 39px !important;
            height: 39px !important
          }
          *[class~=m_wh40] {
            width: 40px !important;
            height: 40px !important
          }
          *[class~=m_wh59] {
            width: 59px !important;
            height: 59px !important
          }
          *[class~=m_wh64] {
            width: 64px !important;
            height: 64px !important
          }
          *[class~=m_wh66] {
            width: 66px !important;
            height: 66px !important
          }
          *[class~=m_wh67] {
            width: 67px !important;
            height: 67px !important
          }
          *[class~=m_wh75] {
            width: 75px !important;
            height: 75px !important
          }
          *[class~=m_wh80] {
            width: 80px !important;
            height: 80px !important
          }
          *[class~=m_wh84] {
            width: 84px !important;
            height: 84px !important
          }
          *[class~=m_wh90] {
            width: 90px !important;
            height: 90px !important
          }
          *[class~=m_wh92] {
            width: 92px !important;
            height: 92px !important
          }
          *[class~=m_wh93] {
            width: 93px !important;
            height: 93px !important
          }
          *[class~=m_wh99] {
            width: 99px !important;
            height: 99px !important
          }
          *[class~=m_w100p] {
            width: 100% !important;
          }
          *[class~=m_plr0] {
            padding-left: 0 !important;
            padding-right: 0 !important
          }
          *[class~=m_pt0] {
            padding-top: 0px !important
          }
          *[class~=m_pt4] {
            padding-top: 4px !important
          }
          *[class~=m_pt8] {
            padding-top: 8px !important
          }
          *[class~=m_pt9] {
            padding-top: 9px !important
          }
          *[class~=m_pt10] {
            padding-top: 10px !important
          }
          *[class~=m_pt16] {
            padding-top: 16px !important
          }
          *[class~=m_pt18] {
            padding-top: 18px !important
          }
          *[class~=m_pt20] {
            padding-top: 20px !important
          }
          *[class~=m_pt28] {
            padding-top: 28px !important
          }
          *[class~=m_pt30] {
            padding-top: 30px !important
          }
          *[class~=m_pt40] {
            padding-top: 40px !important
          }
          *[class~=m_pb0] {
            padding-bottom: 0px !important
          }
          *[class~=m_pb2] {
            padding-bottom: 2px !important
          }
          *[class~=m_pb4] {
            padding-bottom: 4px !important
          }
          *[class~=m_pb8] {
            padding-bottom: 8px !important
          }
          *[class~=m_pb10] {
            padding-bottom: 10px !important
          }
          *[class~=m_pb12] {
            padding-bottom: 12px !important
          }
          *[class~=m_pb16] {
            padding-bottom: 16px !important
          }
          *[class~=m_pb20] {
            padding-bottom: 20px !important
          }
          *[class~=m_pb25] {
            padding-bottom: 25px !important
          }
          *[class~=m_pb26] {
            padding-bottom: 26px !important
          }
          *[class~=m_pb29] {
            padding-bottom: 29px !important
          }
          *[class~=m_pb30] {
            padding-bottom: 30px !important
          }
          *[class~=m_pb32] {
            padding-bottom: 32px !important
          }
          *[class~=m_pb35] {
            padding-bottom: 35px !important
          }
          *[class~=m_pb37] {
            padding-bottom: 37px !important
          }
          *[class~=m_pb39] {
            padding-bottom: 39px !important
          }
          *[class~=m_pb40] {
            padding-bottom: 40px !important
          }
          *[class~=m_pb60] {
            padding-bottom: 60px !important
          }
          *[class~=m_pr0] {
            padding-right: 0px !important
          }
          *[class~=m_pr2] {
            padding-right: 2px !important
          }
          *[class~=m_pr4] {
            padding-right: 4px !important
          }
          *[class~=m_pr8] {
            padding-right: 8px !important
          }
          *[class~=m_pr10] {
            padding-right: 10px !important
          }
          *[class~=m_pr16] {
            padding-right: 16px !important
          }
          *[class~=m_pr20] {
            padding-right: 20px !important
          }
          *[class~=m_pr22] {
            padding-right: 22px !important
          }
          *[class~=m_pl0] {
            padding-left: 0px !important
          }
          *[class~=m_pl5] {
            padding-left: 5px !important
          }
          *[class~=m_pl10] {
            padding-left: 10px !important
          }
          *[class~=m_pl16] {
            padding-left: 16px !important
          }
          *[class~=m_pl20] {
            padding-left: 20px !important
          }
          *[class~=m_h3] {
            font-size: 20px !important;
            line-height: 24px !important
          }
          *[class~=m_fs11] {
            font-size: 11px !important
          }
          *[class~=m_fs12] {
            font-size: 12px !important
          }
          *[class~=m_fs14] {
            font-size: 14px !important
          }
          *[class~=m_fs16] {
            font-size: 16px !important
          }
          *[class~=m_fs18] {
            font-size: 18px !important
          }
          *[class~=m_fs20] {
            font-size: 20px !important
          }
          *[class~=m_fs21] {
            font-size: 21px !important
          }
          *[class~=m_fs24] {
            font-size: 24px !important
          }
          *[class~=m_fs30] {
            font-size: 30px !important
          }
          *[class~=m_fs36] {
            font-size: 36px !important
          }
          *[class~=m_fs41] {
            font-size: 41px !important
          }
          *[class~=m_fs48] {
            font-size: 48px !important
          }
          *[class~=m_lh16] {
            line-height: 16px !important
          }
          *[class~=m_lh20] {
            line-height: 20px !important
          }
          *[class~=m_lh22] {
            line-height: 22px !important
          }
          *[class~=m_lh23] {
            line-height: 23px !important
          }
          *[class~=m_lh28] {
            line-height: 28px !important
          }
          *[class~=m_lh40] {
            line-height: 40px !important
          }
          *[class~=m_lh46] {
            line-height: 46px !important
          }
          *[class~=m_lh52] {
            line-height: 52px !important
          }
          *[class~=m_fs40] {
            font-size: 40px !important
          }
          *[class~=m_overflow112] {
            max-width: 112px !important;
            overflow: hidden !important;
            text-overflow: ellipsis
          }
          *[class~=m_overflow125] {
            max-width: 125px !important;
            overflow: hidden !important;
            text-overflow: ellipsis
          }
          *[class~=m_overflow135] {
            max-width: 135px !important;
            overflow: hidden !important;
            text-overflow: ellipsis
          }
          *[class~=m_overflow156] {
            max-width: 156px !important;
            overflow: hidden !important;
            text-overflow: ellipsis
          }
          *[class~=m_overflow190] {
            max-width: 190px !important;
            overflow: hidden !important;
            text-overflow: ellipsis
          }
          *[class~=m_overflow200] {
            max-width: 200px !important;
            overflow: hidden !important;
            text-overflow: ellipsis
          }
          *[class~=m_overflow240] {
            max-width: 240px !important;
            overflow: hidden !important;
            text-overflow: ellipsis
          }
          *[class~=m_overflow280] {
            max-width: 280px !important;
            overflow: hidden !important;
            text-overflow: ellipsis
          }
          *[class~=m_hoverflow280] {
            max-height: 280px !important;
            overflow: hidden !important;
            text-overflow: ellipsis
          }
          *[class~=m_b0] {
            border: none !important
          }
          *[class~=m_br0] {
            border-radius: 0 0 0 0 !important
          }
          *[class~=m_br_l5] {
            border-radius: 5px 0 0 5px !important
          }
          *[class~=m_br_r5] {
            border-radius: 0 5px 5px 0 !important
          }
          *[class~=m_bg_white] {
            background-color: #ffffff !important
          }
        }
      </style>
    </head>
    <body>
      <table class="m_bg_white" style="width:100%; border:none;" cellpadding="0" cellspacing="0">
        <tr>
          <td class="m_w320 m_pt0" align="center" style="padding-top:20px; width:580px;">
            <table class="m_w320 m_b0" align="center" cellpadding="0" cellspacing="0" style="background-color:#ffffff; width:580px; border:none; height:40px;">
              <tr>
                <td class="m_w280 m_pl20 m_pr20" align="left" style="color:#ffffff;font-size:1px; width:580px;">
                  Just so you know: You have 24 hours to pick your password. After that, you&#39;ll…
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      <table class="m_bg_white" style="width:100%; border:none;" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="width:580px;">
            <table class="m_w320" align="center" cellpadding="0" cellspacing="0" style="background-color:#ffffff; width:580px; border:none;">
              <tr>
                <td align="center" style="padding-bottom:50px; width:580px;">
                  <table cellpadding="0" cellspacing="0" style="background-color:#ffffff; width:100%; border:none;">
                    <tr>
                      <td class="m_w280 m_pl20 m_pr20" align="center" style="padding:0 30px 0 30px;background-color:#ffffff; width:580px;">
                        <table cellpadding="0" cellspacing="0" style="border-collapse:collapse; width:100%; border:none;">
                          <tr>
                            <td class="m_h3 " align="left" valign="bottom" style="padding:0px 0 40px 0;font-family:helvetica neue,helvetica,arial,sans-serif;font-size:22px;line-height:26px;color:#444444">
                              We got your request to change your password!
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td class="m_w280 m_pl20 m_pr20" align="center" style="padding:0 30px 0 30px;background-color:#ffffff; width:580px;">
                        <table cellpadding="0" cellspacing="0" style="border-collapse:collapse; width:100%; border:none;">
                          <tr>
                            <td class="m_plr0" align="center" style="padding:0 35px 0 35px">
                              <a href="http://${host}/reset?id=${userId}&token=${token}" style="text-decoration:none;display:block">
                                <table cellpadding="0" cellspacing="0" style="width:100%; border:none;">
                                  <tr>
                                    <td align="center" style="padding:14px 20px 14px 20px;background-color:#3cd9f5;border-radius:4px">
                                      <a class="m_overflow280" href="http://${host}/reset?id=${userId}&token=${token}" style="font-family:helvetica neue,helvetica,arial,sans-serif;font-weight:bold;font-size:18px;line-height:1.5;color:#ffffff;text-decoration:none;display:block;text-align:center;;max-width:400px;overflow:hidden;text-overflow:ellipsis">
                                        Reset password
                                      </a>
                                    </td>
                                  </tr>
                                </table>
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td class="m_w280 m_pl20 m_pr20" align="center" style="padding:0 30px 0 30px; background-color:#ffffff; width:580px;">
                        <table cellpadding="0" cellspacing="0" style="border-collapse:collapse; width:100%; border:none;">
                          <tr>
                            <td class="m_h30 m_fs30" style="height:40px;font-size:40px;">
                              &nbsp;
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td class="m_w280 m_pl20 m_pr20" align="center" style="padding:0 30px 0 30px; background-color:#ffffff; width:580px;">
                        <table cellpadding="0" cellspacing="0" style="border-collapse:collapse; width:100%; border:none;">
                          <tr>
                            <td class="m_h3 " align="left" valign="bottom" style="padding:0px 0 0px 0;font-family:helvetica neue,helvetica,arial,sans-serif;font-size:22px;line-height:26px;color:#444444">
                              Just so you know: You have 24 hours to pick your password. After that, you'll have to ask for a new one. <br>Didn't ask for a new password? You can ignore this email.
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      <table class="m_bg_white" cellpadding="0" cellspacing="0" style="width:100%; border:none;">
        <tr>
          <td align="center">
            <table class="m_w320" align="center" cellpadding="0" cellspacing="0" style="background-color:#f7f7f7; width:580px; border:none;">
              <tr>
                <td class="m_w280 m_pl20 m_pr20" align="center" style="padding:0 30px 0 30px">
                  <table cellpadding="0" cellspacing="0" style="border-collapse:collapse; width:100%; border:none;">
                    <tr>
                      <td align="left" valign="bottom" style="padding:32px 0 32px 0; height:30px;">
                        <img alt="MyLittleHelper" src="${process.env.BASE_URL}/assets/images/logo/logo-dark.png" style="-ms-interpolation-mode:bicubic;text-decoration:none;display:block;outline:none; float:left; width:128px; height:128px; border:none;" />
                        <div style="    line-height: 128px;
      height: 100%;
      font-size: 15px;
      font-family: sans-serif;
      letter-spacing: 10px; ">247 Seating</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td class="m_w280 m_pl20 m_pr20" align="center" style="padding:0 30px 30px 30px">
                  <table cellpadding="0" cellspacing="0" style="border-collapse:collapse; width:100%; border:none;">
                    <tr>
                      <td>
                        <table cellpadding="0" cellspacing="0" style="border-collapse:collapse; border:none;">
                          <tr>
                            <td align="center" style="font-family:helvetica neue,helvetica,arial,sans-serif;font-size:12px;line-height:22px;color:#444444">
                      Copyright &#174;
       2020 Palate USA, Inc. All rights reserved.
       <!-- <a href="">Terms of Use</a> | <a href="#">Privacy Policy</a> -->
       <br/>
                      <!-- <a href="#" class="unsubscribe"><font color="#ffffff">Unsubscribe</font></a> 
                      <span class="hide">from this newsletter instantly</span> -->
                    </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;
}
