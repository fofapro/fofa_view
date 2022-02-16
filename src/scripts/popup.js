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

const baseFofaUrl = "https://fofa.info/hosts/";

const baseFofaSearch = "https://fofa.info/result?qbase64=";

var getZichan = (ip,load) => {
  // ip = "88.198.38.135"
  // ip = "18.163.79.100"
  let newUrl = baseFofaSearch + Base64.encode("ip=\""+ip+"\"");
  let cHost = baseFofaSearch + Base64.encode("ip=\""+ip+"/24\"");
  axios({
    method: 'get',
    url: newUrl,
  }).then(function (response) {
    let rspData = response.data;
    let root = cheerio.load(rspData);
    let list = root("div[class=rightListsMain]")
    let innerHtml = "";
    list.each(function (i,elem) {
      let node = cheerio(cheerio(this))
      let contentMain = node.find("div[class=contentMain]")
      let contentLeftPlist = contentMain.find("div[class=contentLeft]").find("p")
      let title = ""
      contentLeftPlist.each(function (i, pElement){
        let tmpStr = cheerio(pElement).text()
        if(i === 0){
          title = tmpStr
        }
      })
      let listAddr = node.find("div[class=listAddr]")
      let addrLeft = listAddr.find("div[class=addrLeft]")
      let addrRight = listAddr.find("div[class=addrRight]")
      let port = ""
      if (addrRight.find("a[class=portHover]").length > 0){
        port = addrRight.find("a[class=portHover]").text()
      }
      let protocol = ""
      if (addrRight.find("a[class~=protocolHover]").length > 0){
        protocol = addrRight.find("a[class~=protocolHover]").text()
      }else{
        if (port === "443"){
          protocol = "https"
        }else{
          protocol = "http"
        }
      }
      let host = ""
      let honeypot = "否"
      if (addrLeft.find("span[class=aSpan]").find("a").length === 0){
        host = addrLeft.find("span[class=aSpan]").text()
        if (port !== ""){
          host += (":" + port)
        }
        if(protocol !== ""){
          host = protocol + "://" + host
        }
      }else{
        host = addrLeft.find("span[class=aSpan]").find("a").text()
        if (host.indexOf("http") < 0){
          if (port === "80"){
            host = "http://"+host
          }else if (port === "443"){
            host = "https://"+host
          }
        }
        let imgList = addrLeft.find("a").find("img")
        console.log(imgList)
        imgList.each(function (k, imgElement){
          let imgElem = cheerio(imgElement)
          let aElemStyle = imgElem.parent().attr()['style']
          let alt = imgElem.attr()['alt']
          if (alt !== undefined && alt === "is honeypot" && aElemStyle.indexOf("display:none;") < 0){
            honeypot = "是"
          }
        })
      }
      let url = ""
      if (host.indexOf("http") > -1){
        url = `<a href="${host}" target="_blank" />`
      }

      let line = `
      <tr>
        <td>${title}</td>
        <td>${protocol}</td>
        <td>${port}</td>
        <td>${host}</td>
        <td>${honeypot}</td>
        <td>${url}<i class="layui-icon">&#xe615;</i></td>
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
    let elementList = root("div[class~=ipDiv]")
    let country = "国家/地区：";
    let city = "城市：";
    let group = "组织：";
    let asn = "ASN：";
    let port = "端口：";
    let protocol = "协议：";
    elementList.each(function(i, elem) {
      let thisNode = cheerio(cheerio(this))
      let nodeText = thisNode.text()
      console.log(nodeText+"=========")
      if(nodeText.indexOf("IP: ") === 0){
        rspIp = nodeText.substring("IP: ".length).trim()
      }else if(nodeText.indexOf("国家/地区: ") === 0){
        country += nodeText.substring("国家/地区: ".length).trim()
      }else if(nodeText.indexOf("城市: ") === 0){
        city += nodeText.substring("城市: ".length).trim()
      }else if(nodeText.indexOf("组织: ") === 0){
        group += nodeText.substring("组织: ".length).trim()
      }else if(nodeText.indexOf("ASN: ") === 0){
        asn += nodeText.substring("ASN: ".length).trim()
      }else if(nodeText.indexOf("端口") === 0){
        let portList = thisNode.find("a")
        let tmpPortList = [];
        portList.each(function (j, a){
          let tmpPort = cheerio(cheerio(cheerio(this))).text();
          tmpPort = tmpPort.trim().replace(" ","")
          if(tmpPort.indexOf("-") < 0){
            tmpPortList.push(tmpPort)
          }
        })
        port += tmpPortList.join(",")
      }else if(nodeText.indexOf("协议") === 0){
        let protocolList = thisNode.find("a")
        let tmpProtocolList = [];
        protocolList.each(function (j, a){
          let tmpProtocol = cheerio(cheerio(cheerio(this))).text();
          tmpProtocol = tmpProtocol.trim().replace(" ","")
          if(tmpProtocol.indexOf("-") < 0){
            tmpProtocolList.push(tmpProtocol)
          }
        })
        protocol += tmpProtocolList.join(",")
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

