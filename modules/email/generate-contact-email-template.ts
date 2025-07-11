/**
 *
 * @param subject { String } - Subject of the email
 * @param FromEmail { String } - user's email
 * @param userName { String } - Full name of the user
 * @param phoneNumber { String } - Phone number of the user
 * @param venueName { String } - Venue name
 */
export const generateContactEmailTemplate = (
  subject,
  FromEmail,
  phoneNumber,
  userName,
  business,
  message
) => {
  return `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml">
      <head> 
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="viewport" content="initial-scale=1.0" />
        <meta name="format-detection" content="telephone=no" />
        <title>${subject}</title>
        <style type="text/css">  
        #outlook a {
          padding: 0;
        }
        body {
          width: 100% !important;
          -webkit-text-size-adjust: 100%;
          -ms-text-size-adjust: 100%;
          margin: 0;
          padding: 0;
        }
        .ExternalClass {
          width: 100%;
        }
        .ExternalClass,
        .ExternalClass span,
        .ExternalClass font,
        .ExternalClass td,
        .ExternalClass div {
          line-height: 100%;
        }
        .ExternalClass p {
          line-height: inherit;
        }
        #body-layout {
          margin: 0;
          padding: 0;
          width: 100% !important;
          line-height: 100% !important;
        }
        img {
          display: block;
          outline: none;
          text-decoration: none;
          -ms-interpolation-mode: bicubic;
        }
        a img {
          border: none;
        }
        table td {
          border-collapse: collapse;
        }
        table {
          border-collapse: collapse;
          mso-table-lspace: 0pt;
          mso-table-rspace: 0pt;
        }
        a {
          color: orange;
          outline: none;
        }
        </style>
      </head>
      <body id="body-layout" style="">
        <table width="100%" align="center" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center" valign="top" style="padding: 0 15px;">
              <table align="center" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td height="15" style="height: 15px; line-height:15px;"></td>
                </tr>
                <tr>
                  <td width="600" align="center" valign="top" style="border-radius: 4px; overflow: hidden; box-shadow: 3px 3px 6px 0 rgba(0,0,0,0.2);background: #dde1e6;">
                    <table width="100%" align="center" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" valign="top" style="border-top-left-radius: 4px; border-top-right-radius: 4px; overflow: hidden; padding: 0 20px;background: #2f93b7;">
                          <table width="100%" align="center" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td height="30" style="height: 30px; line-height:30px;"></td>
                            </tr>
                            <tr>
                              <td align="center" valign="top" style="font-family: Arial, sans-serif; font-size: 32px; mso-line-height-rule: exactly; line-height: 32px; font-weight: 400; letter-spacing: 1px;color: #ffffff;"> 247 Seating Inquiry</td>
                            </tr>
                            <tr>
                              <td height="30" style="height: 30px; line-height:30px;"></td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" valign="top" style="padding: 0 20px;">
                          <table width="100%" align="center" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td height="30" style="height: 30px; line-height:30px;"></td>
                            </tr> 
                            <tr> 
                              <td align="left" valign="top" style="font-family: Arial, sans-serif; font-size: 14px; mso-line-height-rule: exactly; line-height: 22px; font-weight: 400;color: #302f35;">Hi, someone left a message for you.</td> 
                            </tr>
                            <tr> 
                              <td height="20" style="height: 20px; line-height:20px;"></td>
                            </tr>
                            <tr>
                              <td align="center" valign="top">
                                <table width="100%" align="center" cellpadding="0" cellspacing="0" border="0">
                                  <tr>
                                    <td align="center" valign="top" style="background: #d1d5da;">
                                      <table width="100%" align="center" cellpadding="0" cellspacing="0" border="0">
                                        <tr>
                                          <td height="1" style="height: 1px; line-height:1px;"></td>
                                        </tr>
                                      </table>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td align="center" valign="top" style="background: #e4e6e9;">
                                      <table width="100%" align="center" cellpadding="0" cellspacing="0" border="0">
                                        <tr>
                                          <td height="2" style="height: 2px; line-height:2px;"></td>
                                        </tr>
                                      </table>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td height="20" style="height: 20px; line-height:20px;"></td>
                            </tr>
                            <tr>
                              <td align="left" valign="top" style="font-family: Arial, sans-serif; font-size: 24px; mso-line-height-rule: exactly; line-height: 30px; font-weight: 500;color: #302f35;">
                                  <!-- #{Subject} -->${subject}
                              </td>
                            </tr>
                            <tr>
                              <td height="20" style="height: 20px; line-height:20px;"></td>
                            </tr>
                            <tr>
                              <td align="center" valign="top">
                                <table width="100%" align="center" cellpadding="0" cellspacing="0" border="0">
                                  <tr>
                                    <td align="center" valign="top">
                                      <table width="100%" align="center" cellpadding="0" cellspacing="0" border="0">
                                        <tr> 
                                          <td width="150" align="left" valign="top" style="padding: 0 10px 0 0;font-family: Arial, sans-serif; font-size: 14px; mso-line-height-rule: exactly; line-height: 20px; font-weight: 400;color: #302f35;font-weight: 500;"><!-- #{Name} -->Name:</td>
                                          <td align="left" valign="top" style="font-family: Arial, sans-serif; font-size: 14px; mso-line-height-rule: exactly; line-height: 20px; font-weight: 400;color: #302f35;"><!-- #{Name} -->${userName}</td>
                                        </tr>
                                        <tr>
                                          <td width="150" align="left" valign="top" style="padding: 0 10px 0 0;font-family: Arial, sans-serif; font-size: 14px; mso-line-height-rule: exactly; line-height: 20px; font-weight: 400;color: #302f35;font-weight: 500;">Email:</td>
                                          <td align="left" valign="top" style="font-family: Arial, sans-serif; font-size: 14px; mso-line-height-rule: exactly; line-height: 20px; font-weight: 400;color: #302f35;"><!-- #{FromEmail} -->${FromEmail}</td> 
                                        </tr> 
                                        <tr>
                                          <td width="150" align="left" valign="top" style="padding: 0 10px 0 0;font-family: Arial, sans-serif; font-size: 14px; mso-line-height-rule: exactly; line-height: 20px; font-weight: 400;color: #302f35;font-weight: 500;">Phone Number:</td>
                                          <td align="left" valign="top" style="font-family: Arial, sans-serif; font-size: 14px; mso-line-height-rule: exactly; line-height: 20px; font-weight: 400;color: #302f35;"><!-- #{FromEmail} -->${phoneNumber}</td> 
                                        </tr> 

                                        <tr> 
                                          <td width="150" align="left" valign="top" style="padding: 0 10px 0 0;font-family: Arial, sans-serif; font-size: 14px; mso-line-height-rule: exactly; line-height: 20px; font-weight: 400;color: #302f35;font-weight: 500;"><!-- #{Name} -->Business Name:</td>
                                          <td align="left" valign="top" style="font-family: Arial, sans-serif; font-size: 14px; mso-line-height-rule: exactly; line-height: 20px; font-weight: 400;color: #302f35;"><!-- #{Name} -->${
                                            business ? business : "N/A"
                                          }</td>
                                        </tr>
                                        <tr> 
                                          <td width="150" align="left" valign="top" style="padding: 0 10px 0 0;font-family: Arial, sans-serif; font-size: 14px; mso-line-height-rule: exactly; line-height: 20px; font-weight: 400;color: #302f35;font-weight: 500;"><!-- #{Name} -->Message:</td>
                                          <td align="left" valign="top" style="font-family: Arial, sans-serif; font-size: 14px; mso-line-height-rule: exactly; line-height: 20px; font-weight: 400;color: #302f35;"><!-- #{Name} -->${message}</td>
                                        </tr>
                                        
                                          <!-- #{EndInfo} -->                                    
                                      </table>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td height="12" style="height: 12px; line-height:12px;"></td>
                                  </tr>
                                  <!--
                                  <tr>
                                    <td align="left" valign="top" style="font-family: Arial, sans-serif; font-size: 14px; mso-line-height-rule: exactly; line-height: 20px; font-weight: 400;color: #302f35;font-weight: 500;">message body</td>
                                  </tr>
                                  <tr>
                                    <td align="left" valign="top" style="font-family: Arial, sans-serif; font-size: 14px; mso-line-height-rule: exactly; line-height: 20px; font-weight: 400;color: #302f35;">
                                     message desc  
                                    </td>
                                  </tr>
                                  -->
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td height="40" style="height: 40px; line-height:40px;"></td>
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
    </html>

    `;
};
