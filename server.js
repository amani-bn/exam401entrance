'use strict';

// app dependencies
const express=require('express');
const superagent=require('superagent');
const pg=require('pg');
const cors=require('cors');
const methodOverride=require('method-override');

// server setup
const app=express();
const PORT=process.env.PORT || 3000;

//middlewares
require('dotenv').config();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static('./public'));
app.set('view engine', 'ejs');

// DB setup
const client = new pg.Client(process.env.DATABASE_URL);
// const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// routes
app.get('/',homeHandler);
app.get('/getCountryResult',getCountryResultHandler);
app.get('/AllCountries',AllCountriesHandler);
app.post('/MyRecords',addcountryHandler);
app.get('/MyRecords',rendercountryHandler);
app.get('/RecordDetails/:id',RecordDetailsHandler);
app.delete('/delete/:id',deleteHandler);




// handlers
function homeHandler(req,res){
    let url='https://api.covid19api.com/world/total';
    superagent.get(url).then(data=>{
    res.render('pages/home',{data:data.body})
    });
}
function getCountryResultHandler(req,res){
let{country,from,to}=req.query;
let url=`https://api.covid19api.com/country/${country}/status/confirmed?from=${from}T00:00:00Z&to=${to}T00:00:00Z`;
superagent.get(url).then(data =>{
let countryData=data.body.map(item =>{
    return new Country(item);
});
res.render('pages/getCountryResult',{data:countryData});
});
}
function AllCountriesHandler(req,res){
let url=`https://api.covid19api.com/summary`;
superagent.get(url).then(data =>{
let countriesData=data.body.Countries.map(item =>{
return new Countries(item);
});
res.render('pages/AllCountries',{data:countriesData});
});
}
function addcountryHandler(req,res){
let {country,totalconfirmed,totaldeaths,totalrecovered,date}=req.body;
let sql=`INSERT INTO countries (country,totalconfirmed,totaldeaths,totalrecovered,date) VALUES ($1,$2,$3,$4,$5);`;
let values =[country,totalconfirmed,totaldeaths,totalrecovered,date];
client.query(sql,values).then(results =>{
    res.redirect('/MyRecords');
});
}
function rendercountryHandler(req,res){
let sql=`SELECT * FROM countries ;`;  
client.query(sql).then(results =>{
    res.render('pages/MyRecords',{data:results.rows});
}); 
}
function RecordDetailsHandler(req,res){
let id=req.params.id;
let sql=`SELECT * FROM countries WHERE id=$1;`;
let value=[id];
client.query(sql,value).then(results =>{
 res.render('pages/RecordDetails',{data:results.rows[0]});
});
}
function deleteHandler(req,res){
    let id=req.params.id;
    let sql=`DELETE FROM countries WHERE id=$1;`;
    let value=[id];
    client.query(sql,value).then(results =>{
    res.redirect('/MyRecords');
    });
}
// constructor
function Country(data){
    this.country=data.Country;
    this.date=data.Date;
    this.cases=data.Cases;
}
function Countries(data){
this.country=data.Country;
this.totalconfirmed=Number(data.TotalConfirmed)+Number(data.NewConfirmed);
this.totaldeaths=Number(data.TotalDeaths)+Number(data.NewDeaths);
this.totalrecovered=Number(data.TotalRecovered)+Number(data.NewRecovered);
this.date=data.Date;
}
// listening

client.connect()
.then(() =>{
app.listen(PORT,() =>{
console.log(`listening on PORT ${PORT}`);
});
});