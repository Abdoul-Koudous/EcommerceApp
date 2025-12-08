const  VerificationEmail = (username, otp)=>{
    return `<!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0" >
        <title>Verification d'Email</title>
        <style>
            body{
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
                color: #333;
            }
            .container{
                max-width: 600px;
                margin: 20px auto;
                background-color: #fff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .header{
                text-align: center;
                border-bottom: 1px solid #eee;
                padding-bottom: 10px;
                margin-bottom: 20px;
            }
            .header h1{
                color: #4CAF50;
            }
            .content{
                text-align: center;
            }
            .content p{
                font-size: 16px;
                line-height: 1.5;
            }
            .otp{
                font-size: 20px;
                font-weight: bold;
                color:#4CAF50 ;
                margin: 20px 0;
            }
            .footer{
                text-align: center;
                font-size: 14px;
                color: #777;
                margin-top: 20px;
            }
        </style>

    </head>

    <body>
        <div class="container">
            <div class="header">
                <h1>Verifier votre address email</h1>
            </div>
            <div class="content">
                <p>Merci de votre inscription, veuillez s'il vous plais utiliser 
                    le code otp pour la verification de votre email: 
                </p>
                <div class="otp" style="background:#e6ffe6; padding:10px 15px; border-radius:6px;">${otp}</div>

                <p>Si vous n'avez fais aucune inscription, veuillez ignorer ce email.</p>
            </div>
            <div class="footer">
                <p>&copy; 2025 YebouShop. Tout droit reserver.</p>
            </div>
        </div>
    </body>
    </html>

    `;
};


export default VerificationEmail;