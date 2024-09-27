javascript:
(()=>{(async function(){if(typeof document>"u"||typeof window>"u")throw new Error("<<< this is a bookmarklet; please run it in a browser >>>");function x(e){return new Promise(t=>{setTimeout(()=>t(),e)})}function T(e,{actions:t=[],done_caption:a="Done"}={}){return new Promise(o=>{let r=document.getElementById("custom_modal");r&&r.querySelector("button.done").click();let l=document.createElement("div");l.style.cssText="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.7); z-index: 9999; ",document.body.appendChild(l);let n=document.createElement("div");n.id="custom_modal",n.style.cssText="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); padding: 20px; background-color: white; border-radius: 1em; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2); z-index: 10000; width: 300px; text-align: center;  box-shadow: 0 22px 70px 4px rgba(0, 0, 0, 0.56); ";let d=document.createElement("div");d.style.cssText=" margin-bottom: 20px; font-size: 16px; color: #333; ",d.innerText=e;let i=document.createElement("ul");i.style.cssText=" list-style: none; padding: 0; margin: 0; ";function c(){n.remove(),l.remove(),o()}let s="padding: 10px 20px; border: none; border-radius: 2em; color: white; cursor: pointer; font-size: 16px; margin: 10px 0;";for(let p of t){let w=document.createElement("button");w.innerText=p.caption,w.style.cssText=`${s}; background-color: #007BFF;`,w.onclick=()=>{p.callback(),p.dismiss&&c()};let u=document.createElement("li");u.appendChild(w),i.appendChild(u)}let f=document.createElement("button");f.className="done",f.innerText=a??"Done",f.style.cssText=`${s}; background-color: #4CAF50;`,f.onclick=()=>{c()};let g=document.createElement("li");return g.appendChild(f),i.appendChild(g),n.appendChild(d),n.appendChild(i),document.body.appendChild(n),new Promise(p=>{n.resolve=p})})}function S(e,t){return`<!DOCTYPE html><html><head><title>${t}</title></head><body><dl>`+e.map(({from:o,from_user:r,from_bot:l,body:n})=>{let d="",i="";return r?(d=o,n.length===1?typeof n[0]=="string"?i=`<pre>${n[0]}</pre>`:n[0]?.mimeType?.startsWith("image/")?i=`<img src="${n[0].data}" />`:i="unknown":n.length>1&&(i="<ul>"+n.map(s=>typeof s=="string"?`<li><pre>${s}</pre></li>`:s?.mimeType.startsWith("image/")?`<li><img src="${s.data}" /></li>`:"<li>unknown</li>").join("")+"</ul>")):l&&(d=o,n.length===1?typeof n[0]=="string"?i=n[0]:n[0]?.mimeType?.startsWith("image/")?i=`<img src="${n[0].data}" />`:i="unknown":n.length>1&&(i="<ul>"+n.map(s=>typeof s=="string"?`<li>${s}></li>`:s?.mimeType.startsWith("image/")?`<li><img src="${s.data}" /></li>`:"<li>unknown</li>").join(`
`)+"</ul>")),`<dt>${d}</dt><dd>${i}</dd>`}).join(`
`)+"</dl></body></html>"}async function E(e,{type:t="application/json",filename:a="chat.json"}={}){let o=new Blob([e],{type:t}),r=document.createElement("a");r.href=URL.createObjectURL(o),r.download=a,document.body.appendChild(r),r.click(),document.body.removeChild(r),URL.revokeObjectURL(r.href)}function A(e,t={}){return new Promise(a=>{e.scrollIntoView(t);let o=new IntersectionObserver(r=>{r.forEach(l=>{l.isIntersecting&&(a(),o.disconnect())})});o.observe(e)})}async function _(e,t,{timeout:a=1e3}={}){console.log(`waiting for "${t}" from"`,e);let o;if(o=e.querySelector(t),o)return o;if(await x(a),o=e.querySelector(t),o)return o;throw{timeout:!0,query_from:e,selector:t}}async function C(e){let t=await fetch(e);if(!t.ok)throw new Error("Failed to fetch image");let a=await t.blob(),o=a.type,r=new FileReader;return new Promise((l,n)=>{r.onloadend=()=>l({mimeType:o,data:r.result}),r.onerror=()=>n(new Error("Failed to read blob")),r.readAsDataURL(a)})}async function j(e){return new Promise((t,a)=>{if(!(e instanceof HTMLImageElement))return a(new Error("Invalid image tag"));let o=document.createElement("canvas"),r=o.getContext("2d");o.width=e.width,o.height=e.height,r.drawImage(e,0,0);let l=o.toDataURL(),n=l.split(";")[0].split(":")[1];t({data:l.split(",")[1],mimeType:n})})}function $(){let e=window.location.href.match(/(\/c\/.*)$/),t=e?e[0]:null;if(t)return document.querySelector(`a[href="${t}"]`)}async function L(){let e=$();if(!e){console.warn("cannot reload because return-button not found");return}console.log("going to main");let t=document.querySelector('a[href="/"]');if(!t){console.warn("cannot reload because main-button not found");return}t.click(),await x(1e3),await _(document.body,".composer-parent #prompt-textarea"),console.log("going back by clicking",e),e.click(),await x(1e3),await _(document.body,"main .h-full article",{timeout:5e3})}async function q(){let e=document.querySelectorAll("main .h-full article");if(!e){console.warn("no chat history found");return}e[0].parentElement.parentElement.scrollTo(0,0);let t=[],a=Array.from(e),o=a.length-1,r=[],l=0;for(let[d,i]of Object.entries(a)){console.log(`message : ${d}/${o}`,i),await A(i);try{let c={from:"",from_user:!1,from_bot:!1,body:[]},s=await _(i,".text-base"),f=i.querySelector("h5.sr-only"),g=i.querySelector("h6.sr-only");f?(c.from_user=!0,c.from=f.textContent?.match(/^(.*?):$/)?.[1]??f.textContent??"(unknown)"):g&&(c.from_bot=!0,c.from=g.textContent?.match(/^(.*?):$/)?.[1]??g.textContent??"(unknown)");let p=s.querySelectorAll(".group\\/dalle-image");for(let u of p){let y=u.querySelector("img");if(y){let m;try{m=await C(y.src)}catch{r.push("dall-e")}finally{c.body.push(m)}}}let w=s.querySelector("[data-message-id] .w-full").children;for(let u of w){if(Array.from(u.classList).includes("markdown")){let m=u.cloneNode(!0),b=m.getElementsByTagName("button");for(;b.length>0;)b[0].parentNode.removeChild(b[0]);for(let h of Array.from(m.getElementsByTagName("*")))h.classList.contains("text-token-text-secondary")&&h.textContent?.trim()&&(h.textContent=`// ${h.textContent}`),h.removeAttribute("class");let v=m.getElementsByTagName("code");for(let h=v.length-1;h>=0;h--){let k=v[h];if(k.children.length===0)continue;let{textContent:I}=k;k.textContent=I}c.body.push(m.innerHTML.replaceAll(/<\/?div>/g,""))}let y=u.querySelector(".whitespace-pre-wrap");y&&c.body.push(y.innerHTML);try{let m=u.querySelector("img");m&&c.body.push(await C(m.src))}catch{console.warn("failed to download img from",u),r.push("general-img")}}t.push(c)}catch(c){console.error(`message ${d} failed because :`,c),l++}}let n={chat:t,img_errs:r,uncaught_errs:l};return console.log("Done!",n),n}function R(){return new Promise(async e=>{let{chat:t,img_errs:a,uncaught_errs:o}=await q()??{};if(console.log("result:",{chat:t,img_errs:a,uncaught_errs:o}),t?.length){let r=a?.length>0,l=$()?.textContent??`${document.title} (untitled)`,n=S(t,l),d=r?`Some images could not be downloaded from "${l}". They are protected, and usually have to be downloaded quickly after page load.`:`"${l}" is ready for download`;await T(d,{actions:[r?{dismiss:!0,caption:"Reload and Try Again",callback:()=>(console.log("will retry"),e("retry"))}:null,{caption:"Save as HTML",callback:async()=>{console.log(n),await E(n,{type:"text/html",filename:`${document.title}.html`}),e(!0)}},{caption:"Save as JSON",callback:async()=>{console.log(t),await E(JSON.stringify(t,"",4),{filename:`${document.title}.json`}),e(!0)}}].filter(i=>!!i)})}else return await T("No chat message captured.",{done_caption:"Sorry"}),!1})}for(;;){if(await R()==="retry"){console.log("will retry"),await L();continue}break}})();})();
