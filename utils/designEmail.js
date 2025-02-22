
export const otpMessage = (name, otp) => {
    return `<!DOCTYPE html>
<html>
<head>
  <style>
    /* Styles for email body */
   @import url('https://fonts.googleapis.com/css2?family=Bellota:wght@700&family=Poppins&family=Quicksand:wght@300&display=swap');


    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background: #ffffff;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: left;
      color: #008080;
      padding: 20px 10px;
      /*border-bottom: 2px solid #008080;*/
    }
    .header h1 {
      margin: 0;
      font-size: 36px;
      font-family: 'Poppins';
    }
    .content {
      padding: 20px;
      color: #333;
      /*line-height: 1.6;*/
    }
    .content p:first-child span{
        font-weight: 600;
    }
    .otp-box {
      text-align: center;
      margin: 20px 0;
      background: #f4f4f4;
      color: #008080;
      font-size: 24px;
      font-weight: bold;
      padding: 10px;
      /*border: 2px dashed #008080;*/
      display: inline-block;
      letter-spacing: 2px;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #999;
      padding: 10px;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>cleareyelens</h1>
    </div>
    <div class="content">
      <p>Hi <span>${name}</span>,</p>
      <p>Reset your password using this OTP:</p>
      <div class="otp-box">${otp}</div>
      <p>Please use this One-time Password (OTP) within 10 minutes to proceed. For your security, do not share  with anyone.</p>
      <!--<p>Thank you,<br>cleareyelens Team</p>-->
    </div>
    <div class="footer">
      &copy; 2024 ClearEyeLens. All rights reserved.
    </div>
  </div>
</body>
</html>
`;
}