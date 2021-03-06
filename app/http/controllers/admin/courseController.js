const controller = require('app/http/controllers/controller');
const Course = require('app/models/course');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');


class courseController extends controller{
    async index(req , res , next){
        try {
             // let courses = await  Course.find({}).sort({ createdAt : 1 });
             let page = req.query.page || 1 ;
             let courses = await  Course.paginate({} , { page , sort : { createdAt : 1 } , limit : 2 });
             res.render('admin/courses/index' , { title: 'دوره ها' , courses });
        } catch (err) {

            next(err);
        }
           
    }

    create(req , res){
        res.render('admin/courses/create')
    }

    async store(req , res , next){
        try{ 
            let status = await this.validationData(req);
            // console.log('image' , req.file);
            // console.log('body' , req.body);

            if(!status){
                if(req.file)
                    fs.unlinkSync(req.file.path);
                return this.back(req , res);
            }
        
        
            //Images
            //create course
            let images = this.imageResize(req.file);
            let { title , body , type , price , tags } = req.body;
            let newCourse = new Course({
                user : req.user._id,
                title,
                slug : this.slug(title),
                body,
                type,
                price,
                // images : JSON.stringify(images),
                images,
                thumb : images[480],
                tags,

            });


            await newCourse.save();
            return res.redirect('/admin/courses');
        } catch (err) {

            next(err);
        }
    }

    async edit(req , res , next){
        try{
            this.isMongoId(req.params.id);

            let course = await Course.findById(req.params.id);
            if(!course) this.error('چنین دوره ای وجود ندارد' , 404);
            return res.render('admin/courses/edit' , { course });
        }catch (err) {
            next(err)
        }
    }
    async update(req , res , next){

        try{
            let status = await this.validationData(req);
            // console.log('image' , req.file);
            // console.log('body' , req.body);

            if(!status){
                if(req.file)
                    fs.unlinkSync(req.file.path);
                return this.back(req , res);
            }

            let objForUpdate = {};


            // set image thumb
            objForUpdate.thumb = req.body.imagesThumb;


            // check image
            if(req.file){
                objForUpdate.images = this.imageResize(req.file);
                objForUpdate.thumb = objForUpdate.images[480];
            }
            delete req.body.images;
            objForUpdate.slug = this.slug(req.body.title);

            // console.log({...req.body , ...objForUpdate });
            await Course.findByIdAndUpdate(req.params.id , { $set : {...req.body , ...objForUpdate }});
            return res.redirect('/admin/courses');
        }catch (err) {
            next(err)
        }

    }


    async destroy(req , res , next){
        try{
            this.isMongoId(req.params.id);

            let course = await Course.findById(req.params.id).populate('episodes').exec();
            if(!course) this.error('چنین دوره ای وجود ندارد' , 404);


            //delete episodes
            course.episodes.forEach( episode => episode.remove());
            //delete Images
            Object.values(course.images).forEach(image => fs.unlinkSync(`./public${image}`));
            //delete courses
            course.remove();

            return res.redirect('/admin/courses');
        } catch (err) {
            next(err)
        }
    }


    imageResize(image){
        const imageInfo = path.parse(image.path);
        let addressImages = {};
        addressImages['original'] = this.getUrlImage(`${image.destination}/${image.filename}`);
        // console.log(addressImages);

        const resize = size => {
            // console.log(size);
            let imageName = `${imageInfo.name}-${size}${imageInfo.ext}`;
            addressImages[size] = this.getUrlImage(`${image.destination}/${imageName}`);
            // console.log(imageName);
            sharp(image.path)
                .resize(size , null)
                .toFile(`${image.destination}/${imageName}`)
        };

        [1080 , 720 , 480].map(resize);

        return addressImages;
    }

    getUrlImage(dir){
        return dir.substring(8);
    }

    slug(title){
        return title.trim().replace(/([^۰-۹آ-یa-z0-9]|-)+/g , "-");
    }
}

module.exports = new courseController();