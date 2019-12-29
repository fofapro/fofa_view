import ext from "./utils/ext";
import storage from "./utils/storage";
import axios from 'axios';
import cheerio from 'cheerio';
import { Base64 } from 'js-base64';

var popup = document.getElementById("app");
storage.get('color', function(resp) {
  var color = resp.color;
  if(color) {
    popup.style.backgroundColor = color
  }
});

// ip 正则
const ipReg = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/;
// 域名正则
const domainReg = /https?:\/\/.+?\//;

const baseFofaUrl = "https://fofa.so/hosts/";

const baseFofaSearch = "https://fofa.so/result?qbase64=";

var getZichan = (ip) => {
  let newUrl = baseFofaSearch + Base64.encode("ip=\""+ip+"\"");
  axios({
    method: 'get',
    url: newUrl,
  }).then(function (response) {
    let rspData = response.data;
    let root = cheerio.load(rspData);
    let list = root("div[class=list_mod]");
    let innerHtml = "";
    list.each(function (i,elem) {
      let firstNode = cheerio(cheerio(this).find("div[class=list_mod_t]")[0]);
      // 提取 url
      let url = "";
      if(firstNode.find("div[class=ip-no-url]").length == 1){
        // 没有链接
      }else{
        url = cheerio(firstNode.find("a")[0]).attr("href");
      }
      let spanList = firstNode.find("div[class=span]").find("span");
      let port = "80";
      let protocol = "http";
      let title = "";
      spanList.each(function (j,ele) {
        let text = cheerio(ele).text();
        text = text.replace("\n","").replace(" ","").replace("\t","").replace("<br />","");
        text = text.replace("          ","").replace("&nbsp;","").replace(" ","");
        if(Number(text)){
          port = Number(text)+"";
        }else{
          protocol = text;
        }
      });
      let liNodeList = cheerio(this).find("div[class=list_mod_c]").find("ul[class=list_sx1]").find("li");
      if(liNodeList.length > 6){
        title = cheerio(liNodeList[0]).text();
        title = title.replace(" ","").replace("\t", "").replace("\n","").replace("<br />","");
      }
      let line = `
      <tr>
        <td>${title}</td>
        <td>${protocol}</td>
        <td>${port}</td>
        <td><a href="${url}" target="_blank"><i class="layui-icon">&#xe615;</i></td>
      </tr>
      `;
      innerHtml += line;
    })
    document.getElementById("tbody").innerHTML = innerHtml;
    // document.getElementById("zichanHost").innerText = newUrl;
    document.getElementById("zichanHost").setAttribute("href",newUrl);
  })
}

var template = (data) => {
  if(data == null){
    alert("请刷新");
    return
  }
  let json = JSON.stringify(data);
  let url = data.url;
  let ip = "";
  if(domainReg.test(url)){
    // 域名
    ip = url.replace("https://","").replace("http://","");
    ip = ip.substr(0,ip.indexOf("/"));
    if(ip.indexOf(":") > 0){
      ip = ip.substr(0,ip.indexOf(":"));
    }
  }
  let newUrl = baseFofaUrl+ip;
  // document.getElementById("ipInfo").setAttribute("style","display: none;");
  axios({
    method: 'get',
    url: newUrl,
  }).then(function (response) {
    let rspData = response.data;
    let root = cheerio.load(rspData);
    let ipElement = cheerio.load(root('div[class=ip_top]').html());
    let rspIp = ipElement("span").html().replace("\n","").replace("<br />","").replace(" ","");
    document.getElementById("ip").innerHTML = rspIp.toLowerCase();
    let liElementList = root("ul[class=ip_con_ul]").find("li");
    let country = "国家/地区：";
    let city = "城市：";
    let group = "组织：";
    let asn = "ASN：";
    let port = "端口：";
    let protocol = "协议：";
    liElementList.each(function(i, elem) {
      let tmpStr = cheerio(cheerio(this).find("span")[1]).text();
      tmpStr = tmpStr.replace("\n","").replace("\t","").replace("<br>","").replace(" ","");
      if(i === 0){
        country = country+tmpStr;
      }else if(i === 1){
        city += tmpStr;
      }else if(i === 2){
        group += tmpStr;
      }else if(i === 4){
        asn += tmpStr;
      }else if(i === 6){
        port += tmpStr;
      }else if(i === 7){
        protocol += tmpStr;
      }
    });
    document.getElementById("country").innerHTML = country;
    document.getElementById("city").innerHTML = city;
    //document.getElementById("group").innerHTML = group;
    //document.getElementById("asn").innerHTML = asn;
    document.getElementById("port").innerHTML = port;
    document.getElementById("protocol").innerHTML = protocol;
    // document.getElementById("hostInfo").innerText = newUrl;
    document.getElementById("hostInfo").setAttribute("href",newUrl);
    getZichan(ipReg.exec(rspIp)[0]);
  });
}

ext.tabs.query({active: true, currentWindow: true}, function(tabs) {
  var activeTab = tabs[0];
  chrome.tabs.sendMessage(activeTab.id, { action: 'process-page' }, template);
});

