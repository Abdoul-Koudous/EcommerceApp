import { sendEmail } from "./emailService.js";


const sendEmailFun = async(to, subject, Text, html, fromName, replyTo)=>{
    const result = await sendEmail(to, subject, Text, html, fromName, replyTo);
    if (result.success){
        return true;
    }else{
        return false;
    }
}

export default sendEmailFun;