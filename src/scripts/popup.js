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

var getZichan = (ip,load) => {
  let newUrl = baseFofaSearch + Base64.encode("ip=\""+ip+"\"");
  let cHost = baseFofaSearch + Base64.encode("ip=\""+ip+"/24\"");
  axios({
    method: 'get',
    url: newUrl,
  }).then(function (response) {
    let rspData = response.data;
    let root = cheerio.load(rspData);
    let list = root("div[id=ajax_content]").find("div[class~=right-list-view-item]")
    let innerHtml = "";
    list.each(function (i,elem) {
      let ndoe = cheerio(cheerio(this).find("div[class~=box-sizing]")[0])
      let reDomain = ndoe.find("div[class=re-domain]")
      let domainList = reDomain.find("a")
      let url = "";
      let host = "";
      if (domainList != null && domainList.length > 0){
        domainList.each(function (j,domainElement) {
          let domainNode  = cheerio(cheerio(cheerio(this)))
          let domainNodeClass = domainNode.attr("class")
          if(domainNodeClass === undefined || domainNodeClass === null){
            host = domainNode.attr("href")
            return false
          }
        })
      }else {
        host = reDomain.text().replace(/ /g,"").replace(/&nbsp;/g, "").replace(/\n/g, "").replace(/\r/g,"").replace(/\t/g, "")
      }
      let port = ""
      let protocol = ""
      let portNode = cheerio(cheerio(this).find("div[class~=re-port]")[0])
      let portElement = portNode.find("a[class~=wordLineFeed]")
      if(portElement !== null && portElement !== undefined){
        port = portElement.text()
      }else{
        let hostSplit = host.split(":")
        if(hostSplit.length > 1){
          port = hostSplit[1]
        }
      }
      port = port.replace(/ /g,"").replace(/&nbsp;/g, "").replace(/\n/g, "").replace(/\r/g,"").replace(/\t/g, "")
      let protocolElement = portNode.find("a[class~=pro]")
      if(protocolElement !== null && protocolElement !== undefined){
        protocol = protocolElement.text()
      }
      if(port === "443" && (protocol == null || protocol === "" || protocol === undefined)){
        protocol = "https"
      }
      if(protocol == null || protocol === "" || protocol === undefined){
        protocol = "http"
      }
      if(port === "" || port === null || port === undefined){
        port = "80"
      }
      if((protocol != null && protocol !== undefined && protocol !== "") && (protocol !== "http" && protocol !== "https") && host.indexOf(":") === -1){
        host = host+":"+port
      }
      let title = ""
      let domainNextNode = reDomain.next()
      let domainTitleNode = domainNextNode.find("a")
      if(domainTitleNode === undefined || domainTitleNode == null || domainTitleNode.length === 0){
        title = domainNextNode.text()
      }
      title = title.replace(/ /g,"").replace(/&nbsp;/g, "").replace(/\n/g, "").replace(/\r/g,"").replace(/\t/g, "")
      if(title === "" && (protocol !== "http" && protocol !== "https")){
        title = protocol
      }
      if(host.indexOf("http") > -1){
        url = host
      }else{
        url = newUrl
      }
      let line = `
      <tr>
        <td>${title}</td>
        <td>${protocol}</td>
        <td>${port}</td>
        <td>${host}</td>
        <td><a href="${url}" target="_blank"><i class="layui-icon">&#xe615;</i></td>
      </tr>
      `;
      innerHtml += line;
    })
    document.getElementById("tbody").innerHTML = innerHtml;
    document.getElementById("zichanHost").setAttribute("href",newUrl);
    document.getElementById("cHost").setAttribute("href",cHost);
    layer.close(load);
  })
};

var template = (data) => {
  if(data == null){
    //alert("请刷新");
    layer.msg('请刷新Tab页面');
    return
  }
  // console.log(data);
  var load = layer.load(0, {content: ""});
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
  axios({
    method: 'get',
    url: newUrl,
  }).then(function (response) {
    let rspData = response.data;
    let root = cheerio.load(rspData);
    let rspIp = root("li[class=layui-this]").find("div[class=ellipise]").text()
    rspIp = rspIp.replace(/ /g,"").replace(/&nbsp;/g, "").replace(/\n/g, "").replace(/\r/g,"").replace(/\t/g, "")
    let elementList = root("div[class=ip-table]").find("div[class~=ip-table-item]")
    let country = "国家/地区：";
    let city = "城市：";
    let group = "组织：";
    let asn = "ASN：";
    let port = "端口：";
    let protocol = "协议：";
    elementList.each(function(i, elem) {
      let thisNode = cheerio(cheerio(this))
      let tmpStr = thisNode.find("div[class=ip-table-content]").text()
      let nameKey = thisNode.find("span[class=ip-table-label]").text()
      // ip-table-label
      tmpStr = tmpStr.toString()
      tmpStr = tmpStr.replace(/ /g,"").replace(/&nbsp;/g, "").replace(/\n/g, "").replace(/\r/g,"").replace(/\t/g, "")
      if(tmpStr === null || tmpStr === undefined || tmpStr === ""){
        tmpStr = cheerio(cheerio(this)).find("div[class~=ip-table-content]").text()
        tmpStr = tmpStr.replace("\n","")
        tmpStr = tmpStr.replace(/ /g,"").replace(/&nbsp;/g, "").replace(/\n/g, ",").replace(/\r/g,"").replace(/\t/g, "")
      }
      if(nameKey.indexOf("IP") > -1){
        rspIp = tmpStr
      }else if(nameKey.indexOf("国家") > -1){
        country += tmpStr
      }else if(nameKey.indexOf("城市") > -1){
        city += tmpStr
      }else if(nameKey.indexOf("组织") > -1){
        group += tmpStr
      }else if(nameKey.indexOf("ASN") > -1){
        asn += tmpStr
      }else if(nameKey.indexOf("端口") > -1){
        port += tmpStr
      }else if(nameKey.indexOf("协议") > -1){
        protocol += tmpStr
      }
    })
    if(port.endsWith(",")){
      port = port.substring(0,port.length-2)
    }
    port = port.replace("端口：","")
    let splitPortArr = port.split(",")
    if (splitPortArr !== null && splitPortArr !== undefined && splitPortArr.length > 0){
      port = ""
      for(let i=0; i<splitPortArr.length;i++){
        let tmpStr = `<span class="second f-tags">${splitPortArr[i]}</span>`
        port += tmpStr
      }
    }
    if(protocol.endsWith(",")){
      protocol = protocol.substring(0,protocol.length-2)
    }
    protocol = protocol.replace("协议：","")
    let splitProtocolArr = protocol.split(",")
    if (splitProtocolArr !== null && splitProtocolArr !== undefined && splitProtocolArr.length > 0){
      protocol = ""
      for(let i=0; i<splitProtocolArr.length;i++){
        let tmpStr = `<span class="second f-tags">${splitProtocolArr[i]}</span>`
        protocol += tmpStr
      }
    }
    if(rspIp === "" || rspIp.indexOf("无数据") > -1){
      layer.close(load);
      layer.msg("无数据")
      return
    }
    port = "端口：" + port
    protocol = "协议：" + protocol
    document.getElementById("country").innerHTML = country;
    document.getElementById("city").innerHTML = city;
    document.getElementById("group").innerHTML = group;
    document.getElementById("asn").innerHTML = asn;
    document.getElementById("port").innerHTML = port;
    document.getElementById("protocol").innerHTML = protocol;
    document.getElementById("hostInfo").setAttribute("href",newUrl);
    getZichan(ipReg.exec(rspIp)[0],load);
  });
}

ext.tabs.query({active: true, currentWindow: true}, function(tabs) {
  var activeTab = tabs[0];
  // console.log(activeTab)
  chrome.tabs.sendMessage(activeTab.id, { action: 'process-page' }, template);
});

