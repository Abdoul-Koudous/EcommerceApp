import { sendEmail } from "./emailService.js";


const sendEmailFun = async(to, subject, Text, html)=>{
    const result = await sendEmail(to, subject, Text, html);
    if (result.success){
        return true;
    }else{
        return false;
    }
}

export default sendEmailFun;