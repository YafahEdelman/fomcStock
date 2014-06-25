var _=require("underscore");
var historic = require('historic');
var brain = require('brain');
function dayGivenMonth(monthNum,yearNum){
  var finding=(monthNum%4==1);//since it will be one higher
  return _.find(
    _.map(
      _.range(0,31).reverse(),function(x){
          return new Date(monthNum+"-"+x+"-"+yearNum);
        }
    ),function(x){
      if(x.toString().indexOf("Wed")>-1){
        if(finding){
          return true;
        }else{
          finding=true;
          return false
        }
      }
    }
  )
}
//2000 only works for now

function getData(monthNum,yearNum,back,callback){
  var wedTime=dayGivenMonth(monthNum,yearNum).getTime();
  var start=new Date();
  start.setTime(wedTime - (back)*86400000);//we will get way back
  var end=new Date();
  end.setTime(wedTime);
  historic("^GSPC", start,end, function (err, data) {//this is the S&P500
    callback(converter(err,data));
  });

}

function converter(err,data){
  //needs to do that for the Close of the previous and the Close of the latest one into 2 lists
  if(err)return err;
  //console.log(data)
  function changer(x){
    return 1/(1+Math.pow(Math.E,(-1*(x.Open-x.Close)/(x.High-x.Low))));
  }
  var output=[changer(data.pop())];
  var input=_.map(data,changer);
  return {input:input,output:output};
}

var dataSets=[];
function getYears(startYear,endYear,back){

  _.map(_.range(startYear,endYear+1),function(year){_.map(_.range(1,13,2),function(month){getData(month,year,back,function(x){dataSets.push(x);})})})
}

var old;
var net;
getYears(2012,2013,1);
setTimeout(function(){
  old=dataSets;dataSets=[];
  getYears(1980,2011,1);
  setTimeout(function(){

  net = new brain.NeuralNetwork();
  //console.log(dataSets);
  net.train(dataSets,{
  errorThresh: 0.005,  // error threshold to reach
  iterations: 20000,   // maximum training iterations
  log: true,           // console.log() progress periodically
  logPeriod: 500,       // number of iterations between logging
  learningRate: 0.7    // learning rate 0.22751
});
  old.forEach(function(i){
    console.log(i.output+"\t"+net.run(i.input));
    })

  //var output = net.run({ r: 1, g: 0.4, b: 0 });
},1000);
},1000)
