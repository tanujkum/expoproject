const express=require('express');
const mysql = require("mysql2");
const cors = require("cors");
const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
var cmd=require('node-cmd');
const bcrypt = require('bcrypt');
const app=express();
const path=require('path');
var exec=require('child_process').execFile;

const dotenv=require("dotenv");
dotenv.config()
const con = mysql.createConnection({
    host:'localhost',
    user:'root',
    password: process.env.PASSWORD,
    insecureAuth : true,
    database:process.env.DATABASE
});
app.use(cors({
    origin:'*'
}));
app.use(express.static(path.join("D:/maps","GoogleMaps")))
app.use(express.json());

app.get('/',(req,res)=>{
    res.send("Hello from home Petals")
});

app.post('/postdata',async(req,res)=>{
    const { id,name,age,watchId }=req.body;
    const table= 'user_data';
    if(!id || !name || !age || !watchId){
        res.status(422).json({error:"please fill the fields properly"})
        return 
    }
    try {
        con.query(`select soldier_id,watchid from ${table} where soldier_id=${id} or watchid=${watchId}`, function(err, result, field){
            if(result.length === 0){
                const query=`insert into  ${table} values ('${id}','${name}','${age}','${watchId}')`;
                con.query(query, (err, result) => {
                    if (err){
                        res.status(422).json({error:"err1"})
                        return
                    }else{
                        res.status(200).json({message:"Insertion Completed"})
                        return
                    }
                }) 
            }else if(result[0].soldier_id===id){  
                res.status(422).json({error:"Soldier already exist"})
                return
            }
            else{
                res.status(422).json({error:"Watchid already exist"})
                return
            }
        })
    }catch(err){
        console.log(err)
    }    
})

app.post('/postdata1',async(req,res)=>{
    const { id,name,lat,lng }=req.body;
    const table= 'base_data';
    if(!id || !name || !lat || !lng){
        res.status(422).json({error:"please fill the All fields properly"})
        return 
    }
    try {
        con.query(`select * from ${table} where id=${id}`, function(err, result, field){
            if(result.length === 0){
                const query=`insert into  ${table} values ('${id}','${name}','${['['+lat,lng+']']}')`;
                con.query(query, (err, result) => {
                    if (err){
                        res.status(422).json({error:err})
                        return
                    }else{
                        res.status(200).json({message:"Insertion Completed"})
                        return
                    }
                }) 
            }else if(result[0].id===Number(id)){  
                res.status(422).json({error:"Base already exist"})
                return
            }
        })
    }catch(err){
        console.log(err)
    }
})

app.post('/admin/postdata',async(req,res)=>{
    const { name,email,c_pass,pass,cPass }=req.body;
    const table= 'admin_data';
    let prev_pass; 
    con.query(`select password from ${table}`,async function(err,result,field){
        prev_pass=result[0].password        

        if(!name || !email || !c_pass || !pass || !cPass){
            res.status(422).json({error:"please fill the fields properly"})
            return 
        }
        if(prev_pass===c_pass){
            if(pass!=cPass){                        
                return res.status(422).json({error:"Password Mismatch"})                        
            }else{                    
                const query=`UPDATE admin_data SET name='${name}',email='${email}',password='${pass}',confirm_password='${cPass}' ORDER BY email LIMIT 1;`;
                con.query(query, (err, result) => {
                    if (err){
                        res.status(422).json({error:"err1"})
                        return
                    }else{
                        return res.status(200).json({message:"Insertion Completed"})                           
                    }
                }) 
            }
        }else{
            return res.status(422).json({error:err})
        }
    })       
})
app.post('/admin/login',async(req,res)=>{
    let {email,pass}= req.body;
    let table='admin_data';
    try{
        if(!email || !pass){
            res.status(422).json({error:"please fill the fields properly"})
            return 
        }
        if (email) {
            con.query(`select * from ${table}`,function(error, results, fields){
                if (error) throw error;
                if(pass!=results[0].confirm_password){
                    res.status(422).send('Incorrect Username and/or Password!');
                }else if (results.length > 0 && email==results[0].email) {
                    res.status(201).send('Signin Successfully');
                }else{
                    res.status(422).send('Invalid Credentials');
                }				
            });
        } else {
            res.status(422).send('Please enter Username and Password!');
        }
    }catch(err){
        console.log(err)
    }  
})

app.get('/getting2',(req,res)=>{
    const sqlquery = "select * from user_data";
    con.query(sqlquery, (err, result) => {
    res.send(result) 
    })
})
app.get('/getting3',(req,res)=>{
    const sqlquery = `SELECT * from reg_users_data WHERE time IN(SELECT MAX(time) FROM reg_users_data WHERE device_id=device_id GROUP BY device_id) ORDER BY device_id ASC,time DESC`;
    con.query(sqlquery, (err, result) => {
    res.send(result) 
    })
})
app.get("/getting4", (req, res) => {
    const sqlquery = "select * from base_data";
    con.query(sqlquery, (err, result) => {
        res.send(result)
     
    });
});


let hyphen;
let hyphen1;
cmd.run(`getmac /v | find "Ethernet"`,function(err,data){
    
    hyphen=data.search('-')-2; 
    hyphen1=data.substr(hyphen,17)
    if(hyphen1!='48-9E-BD-E6-8A-30'){
        process.exit();  
    }
})


var x=null;
let parser;
var connected=0;

function connectComPort(){
    if (x == null) {
        connected = 3;
        return
    }
    const porter = new SerialPort(x, { 
        baudRate: 115200 ,
        dataBits:8,
        parity:'none',
        stopBits:1,
        flowControl:false
    });
    parser = porter.pipe(new Readline({ delimiter: '\n' }));
    porter.on("open", (err) => {
        if(err){
            console.log(err)
        }
        console.log('serial port open');
    });
    
    let flag=0;
    parser.on('data',(data)=>{ 
        console.log('got word from arduino:', data);
        let d_key='&F)J@NcQfTjWnZr4u7x!A%D*G-teyuyt';
        
        if(d_key===data){
            porter.write('vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3', function(err) {
                if(err) {
                    return console.log('Error on write: ', err.message)
                }
                console.log('message written')
            })
        }
        else if('ACK'===data){
            flag=1;
        }
        if(flag===1){
            if(data!='ACK'){
                onData(data)
            }            
        }        
    })    
    connected = 1      
}


function getComPort() {
    var str2;
    var p;
    cmd.run(`wmic path Win32_SerialPort`,function(err,data){
        let str=data.indexOf('Silicon Labs CP210x USB to UART Bridge')
        if (str == -1){
            str2 = '';
        }else{
            str2=data.substr(str,38)
            p = data.substr(str,46)
            p = p.substr(p.indexOf("("),  p.indexOf(")")).trim()
            p = p.slice(1, -1)
            x = p
        }
        if(str2==='Silicon Labs CP210x USB to UART Bridge'){
            if(connected===0){
                connected=1
            }
            if(connected===3){
                console.log(connected)
                connectComPort()
            }
        }
        else if(str2==''){
            connected=3
        }
    })
}


getComPort()
connectComPort()
var arr=[];
setInterval(() => {
    getComPort();
    const query3='select watchid from user_data';
    con.query(query3, (err, result) => {
        if (err){
            console.log(err);
        }else{
            for(let i in result){
                if(result[i].watchid===arr[i])
                {
                    null
                }else{
                    arr.push(result[i].watchid)
                }
            }
        }
    })
}, 1000);

var status_obj={};
const query1=`select device_id,time from reg_users_data`
    con.query(query1, (err, result) => {
        if (err){
            console.log(err);
        }else{  
            for(let i of result){
                status_obj[i.device_id]=Date.now(); 
            }   
        }
    })

// setTimeout(()=>{
// console.log(status_obj)
// },2000)

function onData(data){

    console.log('got word from arduino1:', data); 
    let a=data.split('#')

    
    let data1={'I':a[0], 'H':a[1], 'S': a[2], 'B':a[3], 'R':a[4] , 'N': a[5], 'G':a[6], 'P':a[7], 'E':a[8], 'F':a[9]}
    
    let t1=Date.now();
    // console.log(status_obj,"1")
    status_obj[data1.I]=t1;
    // console.log(status_obj,"2")
    



    let x ,y;
    x= data1.N.substring(0, 4) + "." + data1.N.substring(4, data1.N.length);
    y = data1.G.substring(0, 4) + "." + data1.G.substring(4, data1.G.length);
    let x2=parseInt(x/100);
    let x3=x-x2*100;
    let res=(x2+x3/60).toFixed(6);


    let y2=parseInt(y/100);
    let y3=y-y2*100;
    let res1=(y2+y3/60).toFixed(6);
    const query=`insert into reg_users_data(device_id,coord,temp,spo2,pr,resRate,data,time)
                values ('${data1.I}','${['['+res,res1+']']}','${data1.B}',
                '${data1.S}','${data1.H}','${data1.R}','${data1.P}','${t1}')`;

    con.query(query, (err, result) => {
        if (err){
            console.log(err);
        }else{
            null
        }
    }) 

    let x1 = data1.E.substring(0, 4) + "." + data1.E.substring(4, data1.E.length);
    let y1 = data1.F.substring(0, 4) + "." + data1.F.substring(4, data1.F.length);
    
    let z1=parseInt(x1/100);
    let z2=x1-z1*100;
    let res2=(z1+z2/60).toFixed(6);

    let z5=parseInt(y1/100);
    let z6=y1-z5*100;
    let res3=(z5+z6/60).toFixed(6);




    const query1=`insert into base_station(id,base_st)
                values ('${1}','${['['+res2,res3+']']}')`;

    con.query(query1, (err, result) => {
        if (err){
            console.log(err);
        }else{
            null
        }
    })

}


let lastCoord={};
function getLastCoords(id) {
    const query1=`select coord from reg_users_data where device_id=${id}`
    const getArray=[];
    con.query(query1, (err, result) => {
        if (err){
            console.log(err);
        }else{
            for(let i in result){
                getArray.push(result[i].coord)     
            }                          
            var filtered = getArray.filter(function (el) {
                return el != '[0.000000,0.000000]';
            });
            var lastItem = filtered.pop();
            lastCoord[id] = lastItem       
        }
    })
}



app.get('/getting',async(req,res)=>{
    console.log("first")
    for(let i in arr){
        getLastCoords(arr[i])
    }
    let arr2=[];
    // console.log(arr)
    for(let i in arr){
        const sqlquery = `SELECT * from reg_users_data WHERE time IN(SELECT MAX(time) FROM reg_users_data WHERE device_id=${arr[i]} GROUP BY device_id) ORDER BY device_id ASC,time DESC`;                
        con.query(sqlquery,(err, result) => {
            console.log(result)
            if (result.length!==0) {
                let x = (lastCoord[arr[i]] === undefined)?"[0.000000,0.000000]".split(','):lastCoord[arr[i]].split(',')
                result[0].coord = x.slice(0,2).toString()
                Number(result[0].coord)
                if (x.length > 2){
                    result[0]["altitude"] = x[x.length -1]
                }else {
                    result[0]["altitude"] = 0
                }                
                arr2.push(result); 
            }
        })        
    }
    
   
    setTimeout(async() => {
        if(arr2.length!=0){
           await res.send(arr2); 
        }               
    }, 3000);
});

let lastCoord2={};
function getLastCoords2(id) {
   const sqlquery = `select coord from reg_users_data where device_id=${id}`; 
   let getArray=[]               
    con.query(sqlquery, (err, result) => {
        if (err){
            console.log(err);
        }else{
            for(let i in result){
                getArray.push(result[i].coord)        
            }                          
            let filtered = getArray.filter(function (el) {
                return el != '[0.000000,0.000000]';
            });
            lastCoord2[id] = filtered
        }
    })
}

app.get('/getting6',async(req,res)=>{
    let arr2=[];
    for(let i in arr){
       getLastCoords2(arr[i])
    }
    for(let i in arr){
        const sqlquery = `SELECT * from reg_users_data where device_id=${arr[i]}`;
        con.query(sqlquery,(err, result) => {
            if (result.length!==0) {
                let x;
                let y;
                for(let j of lastCoord2[arr[i]]){
                    x = j.split(',')
                    result[0].coord = x 
                    arr2.push([result[0].device_id,result[0].coord,result[0].data]);                                 
                }
            }            
        })
    }
    
    setTimeout(async() => {
        if(arr2.length!=0){
           await res.send(arr2); 
        }   
    }, 3000);
            
})

let lastCoord1={};
function getLastCoords1(id) {
    const query1=`select base_st from base_station where id=${id}`
    const getArray=[];
    con.query(query1, (err, result) => {
        if (err){
            console.log(err);
        }else{
            for(let i in result){
                getArray.push(result[i].base_st)      
            }                        
            var filtered = getArray.filter(function (el) {
                return el != '[0.000000,0.000000]';
            });
            var lastItem = filtered.pop();
            let lastItem1 = filtered.pop();
            lastCoord1[1] = [lastItem,lastItem1]
        }
    })
}

app.get("/getting5", (req, res) => {
    let arr2=[];
    
    getLastCoords1(1)
    const sqlquery = `SELECT * FROM base_station LIMIT 2`;                
    con.query(sqlquery, (err, result) => {
        if (result.length!==0) {
            for(let i of lastCoord1[1]){
                let x=i.split(',')
                result[0].base_st = x.slice(0,2).toString()
                Number(result[0].base_st)
                arr2.push([result[0].id,result[0].base_st]);
            }
        }
    })
    
    setTimeout(() => {
        res.send(arr2)
    }, 2000);
});

app.get('/status',(req,res)=>{
    let obj={};
    for (const key in status_obj) {
        console.log(`${key}: ${status_obj[key]}`,(Date.now()-status_obj[key])/1000);
        if((Date.now()-status_obj[key])/1000<=120){
            // console.log("online")
            obj[key]="online"
        }else{
            // console.log("offline")
            obj[key]="offline"
        }
    }
    //  console.log("obj",obj)
     res.send(obj)
})

const port=process.env.PORT;
app.listen(port,'localhost',()=>{
    console.log("Kilimanjaro")
    // var fun=function(){
    //     console.log("fun start")
    //     exec('C:/Users/apast/OneDrive/Desktop/petals/electron_petals_copy/petals-win32-x64/petals.exe',function(err,data){
    //         console.log(err)
    //         console.log(data.toString())
    //     })
    // }
    // fun()
})
