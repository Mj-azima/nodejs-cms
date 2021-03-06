const autoBind = require('auto-bind');
const Recaptcha = require('express-recaptcha').Recaptcha;
const { validationResult } = require('express-validator/check');
const isMongoId = require('validator/lib/isMongoId');
const sprintf = require('sprintf-js').sprintf;

module.exports = class controller {
    constructor(){
        autoBind(this);
        this.recaptchaConfig();

    }
    recaptchaConfig(){
        this.recaptcha = new Recaptcha(
            config.service.recaptcha.client_key,
            config.service.recaptcha.secret_key,

            { ...config.service.recaptcha.options }
            );

    }

    recaptchaValidation(req , res){


        return new Promise((resolve , reject) => {
            this.recaptcha.verify(req , (err , data) => {
                if(err){
                    req.flash('errors' , 'گزینه امنیتی مربوط به شناسایی ربات خاموش است ، لطفا از فعال بودن آن اطمینان حاصل فرمایید و مجدد امتحان کنید.');
                    this.back(req , res);
                } else resolve(true);
            });
        });
    }

    async validationData(req){

        const result =  validationResult(req);
        if( !result.isEmpty() ){
            const errors = result.array();
            // console.log(errors);

            const messages = [];
            errors.forEach(err => messages.push(err.msg));
            req.flash('errors' , messages);
            // console.log(messages);
            // console.log("false");
            return false;
        }
        console.log('true');
        return true;
    }

    back(req , res){
        req.flash('formData', req.body);
        return res.redirect(req.header('Referer') || '/');
    }

    isMongoId(paramId){
        if(! isMongoId(paramId)){
            this.error('آی دی وارد شده صحیح نیست', 404);
        }
    }

    error(message , status = 500){
        let err = new Error(message);
        err.status = status;
        console.log(status , err.status)
        throw err;
    }

    getTime(episodes){

        let second = 0;

        episodes.forEach( episode => {
            let time = episode.time.split(':');
            if(time.length === 2 ){
                second += parseInt(time[0])* 60 ;
                second += parseInt(time[1]);
            } else if (time.length === 3){
                second += parseInt(time[0]) * 3600;
                second += parseInt(time[1]) * 60;
                second += parseInt(time[2]);
            }
        });
        let minutes = Math.floor(second/60);
        let hours = Math.floor(minutes/60);

        minutes -= hours *60;
        second = Math.floor(((second / 60) % 1) *60);


        return sprintf('%02d:%02d:%02d' , hours , minutes , second);
    }
}

