const path = require("path");
const express = require('express');
const axios = require('axios');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require("express-session");
const multer = require('multer');

// Base URL for the API
//const base_url = "https://api.example.com";
const base_url = "http://localhost:3000";

// Set the template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname,'/public/views'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({secret:"mysession",resave:false,saveUninitialized:true}));

// Serve static files
app.use(express.static (__dirname + '/public'));

app.use(cookieParser()); // เรียกใช้ cookie

const music = multer.diskStorage({
    destination: function (req,file,cb) {
        cb(null, path.join(__dirname, './public/Pictures'));
    },
    filename: function (req,file,cb) {
        cb(null, file.originalname);
    }
})

const ms = multer({storage: music});

app.get("/", async (req, res) => {
    try {
        const response = await axios.get(base_url + '/music'); //เข้าถึงDB music
        if (req.cookies.id) {
            const response2 = await axios.get(base_url + "/playlist");
            const playlists = response2.data;
            let pl = [];
            for (let pls of playlists) {
                if (pls.user_id == req.cookies.id) {
                    const response2 = await axios.get(base_url + "/playlist/" + pls.playlist_id);
                    const data = response2.data;
                    pl.push(data);
                }
            }
            return res.render("home", { musics: response.data, pl: pl, 
                Role: req.cookies.role, User: req.cookies.username});
        } else {
            return res.render("home", { musics: response.data, pl: [], Role: req.cookies.role, User: req.cookies.username});
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error /');
    }
});

app.get("/info", async (req, res) => {
    try {
        const response = await axios.get(base_url + '/user');
        const users = response.data;

        for (let user of users) {
            if (req.cookies.username === user.username) {
                const response2 = await axios.get(base_url + '/user/' + user.user_id);
                return res.render("info", { users: response2.data, Role: req.cookies.role, User: req.cookies.username});
            }
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error info');
    }
});

app.get("/admin", async (req, res) => {
    try {
        if (req.cookies.role === 'admin') {
            const response = await axios.get(base_url + "/music");
            return res.render("admin", { musics: response.data, Role: req.cookies.role, User: req.cookies.username});
        } else if (req.cookies.role === 'user') {
            return res.redirect("/");
        } else {
            return res.redirect("/");
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error admin');
    }
});

app.get("/music_detail_admin/:id", async (req, res) => {
    try {
        if (req.cookies.role === 'admin') {
            const response = await axios.get(base_url + '/music/' + req.params.id); //เข้าถึงDB music และเข้าถึง id
            return res.render("music_detail_admin", { muscis_detail: response.data, Role: req.cookies.role, User: req.cookies.username }); // ส่งค่าไปหน้า playlist_hit ใน {} ซ้าย เป็นตัวแปรและเก็บค่า data
        } else if (req.cookies.role === 'user') {
            return res.redirect("/");
        } else {
            return res.redirect("/");
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error music_detail_admin');
    }
});

app.get("/music_add_admin", async (req, res) => {
    try {
        if (req.cookies.role === 'admin') {
            return res.render("music_add_admin", { Role: req.cookies.role, User: req.cookies.username }); // ส่งค่าไปหน้า playlist_hit ใน {} ซ้าย เป็นตัวแปรและเก็บค่า data
        } else if (req.cookies.role === 'user') {
            return res.redirect("/");
        } else {
            return res.redirect("/");
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error music_add_admin');
    }
});

app.post("/createMusic", ms.single('musicImg') ,async (req, res) => {
    try {
        if (req.cookies.role === 'admin') {
            const data = {
                title: req.body.title,
                singer: req.body.singer,
                genre: req.body.genre,
                release_date: req.body.release_date,
                musicImg: req.file.filename
            }
            
            await axios.post(base_url + "/music" , data);
            return res.redirect("/admin");
        } else if (req.cookies.role === 'user') {
            return res.redirect("/");
        } else {
            return res.redirect("/");
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error createMusic');
    }
});

app.get("/music_edit_admin/:id", async (req, res) => {
    try {
        if (req.cookies.role === 'admin') {
            const response = await axios.get(base_url + "/music/" + req.params.id);
            return res.render("music_edit_admin", { music: response.data, Role: req.cookies.role, User: req.cookies.username }); // ส่งค่าไปหน้า playlist_hit ใน {} ซ้าย เป็นตัวแปรและเก็บค่า data
        } else if (req.cookies.role === 'user') {
            return res.redirect("/");
        } else {
            return res.redirect("/");
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error music_edit_admin');
    }
});

app.post("/editMusic/:id", ms.single('musicImg') ,async (req, res) => {
    try {
        if (req.cookies.role === 'admin') {
            const response = await axios.get(base_url + "/music/" + req.params.id);
            const music = response.data;

            const data = {
                title: req.body.title === '' ? music.title : req.body.title,
                singer: req.body.singer === '' ? music.singer : req.body.singer,
                genre: req.body.genre === '' ? music.genre : req.body.genre,
                release_date: req.body.release_date === '' ? music.release_date : req.body.release_date,
                musicImg: !req.file ? music.musicImg : req.file.filename
            }
            
            await axios.put(base_url + "/music/" + req.params.id, data);
            return res.redirect("/admin");
        } else if (req.cookies.role === 'user') {
            return res.redirect("/");
        } else {
            return res.redirect("/");
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error editMusic');
    }
});

app.get("/music_delete_admin/:id", async (req, res) => {
    try {
        if (req.cookies.role === 'admin') {
            await axios.delete(base_url + "/music/" + req.params.id)
            const response = await axios.get(base_url + "/music");
            return res.redirect("/admin");
        } else if (req.cookies.role === 'user') {
            return res.redirect("/");
        } else {
            return res.redirect("/");
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error music_detail');
    }
});

// กดปุ่มเพลงเศร้าแล้วlinkไปที่plylistเพลงเศร้า
app.get("/playlist_sad", async (req, res) => {
    try {
        const response = await axios.get(base_url + '/music'); //เข้าถึงDB music
        const musics = response.data; //ให้ res ดึงข้อมูลจาก DB มาใส่ในตัวแปร
        
        let datas = []; // สร้างตัวแปรมาเก็บข้อมูล
        for (let music of musics) {
            if (music.genre === 'เศร้า') { // check genre
                const response2 = await axios.get(base_url + '/music/' + music.id); // หากเจอ genre เศร้าสามารถดึงข้อมูลมาทั้งแถว
                const data = response2.data; // เอาข้อมูลของแถวมาเก็บในตัวแปร
                datas.push(data); // ใส่ข้อมูลลงไปใน array
            }
        }
        return res.render("playlist_sad", { muscis_sad: datas, Role: req.cookies.role, User: req.cookies.username }); // ส่งค่าไปหน้า playlist_sad ใน {} ซ้าย เป็นตัวแปรและเก็บค่า data
    } catch (err) {
        console.error(err);
        res.status(500).send('Error playlist_sad');
    }
});

// กดปุ่มเพลงเศร้าแล้วlinkไปที่plylistเพลงรัก
app.get("/playlist_love", async (req, res) => {
    try {
        const response = await axios.get(base_url + '/music'); //เข้าถึงDB music
        const musics = response.data; //ให้ res ดึงข้อมูลจาก DB มาใส่ในตัวแปร
        
        let datas = []; // สร้างตัวแปรมาเก็บข้อมูล
        for (let music of musics) {
            if (music.genre === 'รัก') { // check genre
                const response2 = await axios.get(base_url + '/music/' + music.id); // หากเจอ genre เศร้าสามารถดึงข้อมูลมาทั้งแถวด้วย music.id
                const data = response2.data; // เอาข้อมูลของแถวมาเก็บในตัวแปร
                datas.push(data); // ใส่ข้อมูลลงไปใน array
            }
        }
        return res.render("playlist_love", { muscis_love: datas, Role: req.cookies.role, User: req.cookies.username }); // ส่งค่าไปหน้า playlist_sad ใน {} ซ้าย เป็นตัวแปรและเก็บค่า data
    } catch (err) {
        console.error(err);
        res.status(500).send('Error playlist_love');
    }
});

// กดปุ่มเพลงเศร้าแล้วlinkไปที่plylistเพลงสากล
app.get("/playlist_modern", async (req, res) => {
    try {
        const response = await axios.get(base_url + '/music'); //เข้าถึงDB music
        const musics = response.data; //ให้ res ดึงข้อมูลจาก DB มาใส่ในตัวแปร
        
        let datas = []; // สร้างตัวแปรมาเก็บข้อมูล
        for (let music of musics) {
            if (music.genre === 'สากล') { // check genre
                const response2 = await axios.get(base_url + '/music/' + music.id); // หากเจอ genre เศร้าสามารถดึงข้อมูลมาทั้งแถว
                const data = response2.data; // เอาข้อมูลของแถวมาเก็บในตัวแปร
                datas.push(data); // ใส่ข้อมูลลงไปใน array
            }
        }
        return res.render("playlist_modern", { muscis_modern: datas, Role: req.cookies.role, User: req.cookies.username }); // ส่งค่าไปหน้า playlist_modern ใน {} ซ้าย เป็นตัวแปรและเก็บค่า data
    } catch (err) {
        console.error(err);
        res.status(500).send('Error playlist_modern');
    }
});

// กดปุ่มเพลงเศร้าแล้วlinkไปที่plylistเพลงฮิต
app.get("/playlist_hit", async (req, res) => {
    try {
        const response = await axios.get(base_url + '/music'); //เข้าถึงDB music
        const musics = response.data; //ให้ res ดึงข้อมูลจาก DB มาใส่ในตัวแปร
        
        let datas = []; // สร้างตัวแปรมาเก็บข้อมูล
        for (let music of musics) {
            if (music.genre === 'ฮิต') { // check genre
                const response2 = await axios.get(base_url + '/music/' + music.id); // หากเจอ genre เศร้าสามารถดึงข้อมูลมาทั้งแถว
                const data = response2.data; // เอาข้อมูลของแถวมาเก็บในตัวแปร
                datas.push(data); // ใส่ข้อมูลลงไปใน array
            }
        }
        return res.render("playlist_hit", { muscis_hit: datas, Role: req.cookies.role, User: req.cookies.username }); // ส่งค่าไปหน้า playlist_hit ใน {} ซ้าย เป็นตัวแปรและเก็บค่า data
    } catch (err) {
        console.error(err);
        res.status(500).send('Error playlist_hit');
    }
});

app.get("/music_detail/:id", async (req, res) => {
    try {
        const response = await axios.get(base_url + '/music/' + req.params.id); //เข้าถึงDB music และเข้าถึง id
        const response2 = await axios.get(base_url + "/getcomment/" + req.params.id);
        return res.render("music_detail", { musicid: req.body.musicid, reviews: response2.data, muscis_detail: response.data, 
            Role: req.cookies.role, User: req.cookies.username }); // ส่งค่าไปหน้า playlist_hit ใน {} ซ้าย เป็นตัวแปรและเก็บค่า data
    } catch (err) {
        console.error(err);
        res.status(500).send('Error music_detail id');
    }
});

app.post("/review", async (req,res) => {
    try {
        const data = {
            music_id:req.body.musicid,
            user_id:req.cookies.id,
            score:req.body.score,
            comment:req.body.comment
        }
        await axios.post(base_url + "/createreview", data);
        
        return res.redirect("/music_detail/" + req.body.musicid);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error review');
    }
});

app.get("/playlist_create", async (req,res) => {
    try {
        if (req.cookies.role) {
            return res.render("playlist_create", { Role: req.cookies.role, User: req.cookies.username });
        } else {
            return res.redirect("/");
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error review');
    }
});

app.post("/createPlaylist", async (req,res) => {
    try {
        const response = await axios.get(base_url + "/playlist");
        const pl = response.data;

        for (let pls of pl) {
            if (pls.playlistname == req.body.name) {
                return res.redirect("/");
            }
        }

        const data = {
            playlistname: req.body.name,
            user_id: req.cookies.id
        }
        await axios.post(base_url + "/playlist", data);
        return res.redirect("/");
    } catch (err) {
        console.error(err);
        res.status(500).send('Error createPlaylist');
    }
});

app.get("/playlist_add/:id", async (req,res) => {
    try {
        const response2 = await axios.get(base_url + "/playlist");
        const playlists = response2.data;
        let pl = [];
        for (let pls of playlists) {
            if (pls.user_id == req.cookies.id) {
                const response2 = await axios.get(base_url + "/playlist/" + pls.playlist_id);
                const data = response2.data;
                pl.push(data);
            }
        }
        if (pl.length > 0) {
            return res.render("playlist_add", { musicid: req.params.id, pl: pl, 
                Role: req.cookies.role, User: req.cookies.username});
        } else {
            return res.redirect("/");
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error playlist_add');
    }
});

app.post("/addPL/:id", async (req,res) => {
    try {
        const response = await axios.get(base_url + "/music/" + req.params.id);
        const music = response.data;

        const data = {
            playlistname: req.body.plname,
            music_id: req.params.id,
            title: music.title,
            singer: music.singer,
            user_id: req.cookies.id
        }
        await axios.post(base_url + "/playlist", data);

        return res.redirect("/");
    } catch (err) {
        console.error(err);
        res.status(500).send('Error addPL');
    }
});

app.get("/playlist_detail/:name", async (req,res) => {
    try {
        const response = await axios.get(base_url + "/playlist");
        const playlist = response.data;
        let pl = [];
        for (let pls of playlist) {
            if (pls.playlistname == req.params.name) {
                const response1 = await axios.get(base_url + "/playlist/" + pls.playlist_id);
                const data = response1.data;
                pl.push(data);
            }
        }

        const response2 = await axios.get(base_url + "/music");
        const musics = response2.data;
        let data = [];
        for (let ms of musics) {
            for (let pls of pl) {
                if (ms.id == pls.music_id) {
                    const response1 = await axios.get(base_url + "/music/" + ms.id);
                    const dt = response1.data;
                    data.push(dt);
                }
            }
        }

        return res.render("playlist_detail", { musics: data, Role: req.cookies.role, User: req.cookies.username });
    } catch (err) {
        return res.redirect("/");
    }
});

app.get("/login", (req,res) => {
    try {
        return res.render("login", {Fail: ""});
    } catch (err) {
        console.error(err);
        res.status(500).send('Error login');
    }
})

app.post("/login2", async (req,res) => { //check login
    try {
        const response = await axios.get(base_url + "/user");
        const users = response.data;

        let checkFail = true;
        for (let user of users) {
            if (req.body.username === user.username) {
                if (req.body.password === user.password) {
                    checkFail = false;
                    if (user.role === 'admin') {
                        req.session.userloginid = user.user_id;
                        res.cookie('role', 'admin', {maxAge: 9000000, httpOnly: true}); // อยู่ใน web ได้ 15 นาที || 900k ms
                    } else if (user.role === 'user') {
                        req.session.userloginid = user.user_id;
                        res.cookie('role', 'user', {maxAge: 9000000, httpOnly: true});
                    } 
                    res.cookie('username', user.username, {maxAge: 9000000, httpOnly: true});
                    res.cookie('id', user.user_id, {maxAge: 9000000, httpOnly: true});
                    return res.redirect("/");
                }
            } 
        }

        if (checkFail) {
            return res.render("login", {Fail: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"}); // ส่งข้อมูลของ role และ fail เช็คว่าชื่อผู้ใช้กับรหัสผิดหรือไม่ ไปหน้า login 
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error register2');
    }
})

app.get("/register", (req,res) => {
    try {
        return res.render("register");
    } catch (err) {
        console.error(err);
        res.status(500).send('Error register');
    }
})

// port คือการรับข้อมูล หรือ แก้ไข
app.post("/register2", async (req,res) => {
    try {
        const data = {
            username: req.body.username,
            password: req.body.password,
            email: req.body.email,
            age: req.body.age
        }

        await axios.post(base_url + "/user", data);
        return res.redirect("/"); // redirect คือการไปที่หน้านั้นเลยโดยไม่ส่งข้อมูล
    } catch (err) {
        console.error(err);
        res.status(500).send('Error register2');
    }
})

app.get("/resetpass", (req,res) => {
    try {
        return res.render("resetpass", {Fail:""});
    } catch (err) {
        console.error(err);
        res.status(500).send('Error resetpass');
    }
})

app.post("/resetpass", async (req,res) => {
    try {
        const response = await axios.get(base_url + "/user");
        const users = response.data;

        let checkFail = true;
        for (let user of users){
            if(req.body.username === user.username){
                if(req.body.email === user.email){
                    checkFail = false;
                    res.cookie('resetpass', user.username, {maxAge: 9000000, httpOnly: true});
                    return res.render("resetpass2", {Fail: ""});
                }
            }
        }

        if (checkFail) {
            return res.render("resetpass", {Fail: "ชื่อผู้ใช้หรืออีเมล์ไม่ถูกต้อง"}); // ส่งข้อมูลของ role และ fail เช็คว่าชื่อผู้ใช้กับรหัสผิดหรือไม่ ไปหน้า login 
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error resetpass');
    }
})

app.get("/resetpass2", (req,res) => {
    try {
        return res.render("resetpass2", {Fail:""});
    } catch (err) {
        console.error(err);
        res.status(500).send('Error resetpass2');
    }
})

app.post("/resetpass2", async (req,res) => {
    try {
        let checkFail = true;
        if(req.body.new_password === req.body.con_password){
            checkFail = false;
        }

        if (checkFail) { // เช็คว่ารหัสผ่านตรงกันหรือไม่ 
            return res.render("resetpass2", {Fail: "รหัสผ่านไม่ตรงกัน"}); // ส่งข้อมูลของ role และ fail เช็คว่าชื่อผู้ใช้กับรหัสผิดหรือไม่ ไปหน้า login 
        } else {
            const response = await axios.get(base_url + "/user");
            const users = response.data;
    
            for (let user of users){
                if(req.cookies.resetpass === user.username){
                    const data = {
                        username: user.username,
                        password: req.body.new_password,
                        email: user.email,
                        age: user.age,
                        role: user.role
                    }
                    await axios.put(base_url + "/user/" +  user.user_id, data);
                    res.clearCookie('resetpass');
                }
            }

            return res.redirect("/");
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error resetpass2');
    }
});

app.get("/logout", (req,res) => {
    try {
        res.clearCookie('role');
        res.clearCookie('username');
        res.clearCookie('id');
        return res.redirect("/");
    } catch (err) {
        console.error(err);
        res.status(500).send('Error logout');
    }
})

app.listen(5500, () => console.log('Server started on port http://localhost:5500'));