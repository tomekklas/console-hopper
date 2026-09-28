(()=>{var Le=r=>r.filter((p,c)=>r.indexOf(p)===c),vn=r=>{let p=document.createElement("template");return p.innerHTML=String(r).trim(),Array.from(p.content.childNodes)},ea=r=>{if(r!=null){if(r==="true")return!0;if(r==="false")return!1;if(r==="null")return null;if(r===+r+"")return+r;if(/^(?:\{[\w\W]*\}|\[[\w\W]*\])$/.test(r))try{return JSON.parse(r)}catch{return r}return r}},xn=r=>{document.readyState!=="loading"?setTimeout(r,0):document.addEventListener("DOMContentLoaded",()=>r(),{once:!0})},wn=["click","auxclick","mousedown","mouseup","dblclick"],ft=class r{constructor(p){this.els=p,this.length=p.length,p.forEach((c,_)=>{this[_]=c})}each(p){return this.els.forEach((c,_)=>p.call(c,_,c)),this}map(p){let c=[];return this.els.forEach((_,u)=>{let E=p.call(_,u,_);E!=null&&c.push(E)}),new r(c)}get(p){return p==null?this.els.slice():this.els[p]}first(){return new r(this.els.slice(0,1))}last(){return new r(this.els.slice(-1))}eq(p){let c=this.els.at(p);return new r(c?[c]:[])}filter(p){return typeof p=="function"?new r(this.els.filter((c,_)=>p.call(c,_,c))):new r(this.els.filter(c=>c.matches&&c.matches(p)))}not(p){return new r(this.els.filter(c=>!(c.matches&&c.matches(p))))}is(p){return this.els.some(c=>c.matches&&c.matches(p))}find(p){let c=[];return this.els.forEach(_=>{_.querySelectorAll&&c.push(..._.querySelectorAll(p))}),new r(Le(c))}closest(p){let c=[];return this.els.forEach(_=>{let u=_.closest&&_.closest(p);u&&c.push(u)}),new r(Le(c))}parent(){return new r(Le(this.els.map(p=>p.parentElement).filter(Boolean)))}children(p){let c=[];return this.els.forEach(_=>{Array.from(_.children||[]).forEach(u=>{(!p||u.matches(p))&&c.push(u)})}),new r(c)}prev(){return new r(Le(this.els.map(p=>p.previousElementSibling).filter(Boolean)))}prevAll(p){let c=[];return this.els.forEach(_=>{let u=_.previousElementSibling;for(;u;)(!p||u.matches(p))&&c.push(u),u=u.previousElementSibling}),new r(c)}_insert(p,c){let _=Sn(p);return this.els.forEach((u,E)=>{let A=E===this.els.length-1?_:_.map(I=>I.cloneNode(!0));c(u,A)}),this}append(p){return this._insert(p,(c,_)=>_.forEach(u=>c.appendChild(u)))}prepend(p){return this._insert(p,(c,_)=>{let u=c.firstChild;_.forEach(E=>c.insertBefore(E,u))})}before(p){return this._insert(p,(c,_)=>{c.parentNode&&_.forEach(u=>c.parentNode.insertBefore(u,c))})}after(p){return this._insert(p,(c,_)=>{if(!c.parentNode)return;let u=c.nextSibling;_.forEach(E=>c.parentNode.insertBefore(E,u))})}appendTo(p){return i(p).append(this),this}remove(){return this.els.forEach(p=>p.remove&&p.remove()),this}empty(){return this.els.forEach(p=>{for(;p.firstChild;)p.removeChild(p.firstChild)}),this}text(p){return p===void 0?this.els[0]?this.els[0].textContent:"":(this.els.forEach(c=>{c.textContent=p}),this)}html(p){return p===void 0?this.els[0]?this.els[0].innerHTML:"":(this.els.forEach(c=>{c.innerHTML=p}),this)}val(p){return p===void 0?this.els[0]?this.els[0].value:void 0:(this.els.forEach(c=>{c.value=p}),this)}attr(p,c){return c===void 0?this.els[0]?this.els[0].getAttribute(p):void 0:(this.els.forEach(_=>_.setAttribute(p,c)),this)}removeAttr(p){return this.els.forEach(c=>c.removeAttribute(p)),this}prop(p,c){return c===void 0?this.els[0]?this.els[0][p]:void 0:(this.els.forEach(_=>{_[p]=c}),this)}data(p){let c=this.els[0];return c?ea(c.getAttribute("data-"+p)):void 0}css(p,c){if(c===void 0&&typeof p=="string"){let _=this.els[0];return _?getComputedStyle(_).getPropertyValue(p)||_.style[p]:void 0}return this.els.forEach(_=>{_.style[p]=c}),this}addClass(p){let c=String(p).split(/\s+/).filter(Boolean);return this.els.forEach(_=>_.classList.add(...c)),this}removeClass(p){let c=String(p).split(/\s+/).filter(Boolean);return this.els.forEach(_=>_.classList.remove(...c)),this}toggleClass(p,c){return this.els.forEach(_=>{c===void 0?_.classList.toggle(p):_.classList.toggle(p,!!c)}),this}hasClass(p){return this.els.some(c=>c.classList.contains(p))}on(p,c,_){typeof c=="function"&&(_=c,c=null);let u=String(p).split(/\s+/).filter(Boolean);return this.els.forEach(E=>{u.forEach(A=>{E.addEventListener(A,I=>{let z=E;if(c){let G=I.target&&I.target.closest?I.target.closest(c):null;if(!G||!E.contains(G))return;z=G}_.call(z,I)===!1&&(I.preventDefault(),I.stopPropagation())})})}),this}trigger(p){return this.els.forEach(c=>{if(p instanceof Event){c.dispatchEvent(p);return}if(p==="focus"&&c.focus)return c.focus();if(p==="blur"&&c.blur)return c.blur();if(p==="select"&&c.select)return c.select();if(p==="submit"&&c.submit)return c.submit();let _=wn.includes(p)?MouseEvent:Event;c.dispatchEvent(new _(p,{bubbles:!0,cancelable:!0}))}),this}submit(){return this.els.forEach(p=>{p.submit?p.submit():p.dispatchEvent(new Event("submit",{bubbles:!0,cancelable:!0}))}),this}focus(){return this.els[0]&&this.els[0].focus&&this.els[0].focus(),this}blur(){return this.els.forEach(p=>p.blur&&p.blur()),this}ready(p){return xn(p),this}show(){return this.els.forEach(p=>{p.style&&p.style.display==="none"&&(p.style.display="")}),this}hide(){return this.els.forEach(p=>{p.style&&(p.style.display="none")}),this}fadeOut(p,c){return this.els.forEach(_=>{_.style&&(_.style.transition=`opacity ${p}ms`,_.style.opacity="0")}),c&&setTimeout(c,p),this}},Sn=r=>r==null?[]:typeof r=="string"?vn(r):r instanceof ft?r.els.slice():Array.isArray(r)||r instanceof NodeList?Array.from(r).flatMap(Sn):r.nodeType?[r]:[];function i(r){if(r instanceof ft)return r;if(r==null)return new ft([]);if(typeof r=="function")return xn(r),new ft([document]);if(typeof r=="string"){let p=r.trim();return p[0]==="<"?new ft(vn(p)):new ft(Array.from(document.querySelectorAll(p)))}return r===window||r===document||r.nodeType?new ft([r]):Array.isArray(r)||r instanceof NodeList?new ft(Array.from(r)):new ft([r])}i.Event=(r,p)=>{let c=wn.includes(r)?MouseEvent:Event;return new c(r,{bubbles:!0,cancelable:!0,...p||{}})};var v=r=>r==null?"":String(r).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"),nt=v,Tn=r=>{let p=(r||"").trim(),c=p.match(/Account:\s*(.+?)\s*\((\d+)\)/);if(c)return{name:c[1].trim(),id:c[2].trim()};let _=p.replace(/^Account:\s*/i,"").trim(),u=_.match(/\b\d{12}\b/);return{name:_,id:u?u[0]:""}},fo=(r,p,c)=>{if(!r||r.length===0)return!1;let _=(p||"").toLowerCase(),u=(c||"").toString().trim();for(let E of r){let A=(E||"").toString().trim();if(A&&(u&&A===u||_.includes(A.toLowerCase())))return!0}return!1},kn=(r,p)=>{if(!r||r.length===0)return!1;let c=(p||"").toLowerCase();for(let _ of r){let u=(_||"").toString().trim().toLowerCase();if(u&&c.includes(u))return!0}return!1},ho=/^[a-z0-9-]+$/,En=r=>{let p=[],c=new Set;for(let _ of String(r||"").split(`
`)){let u=_.trim();if(!u)continue;let E=u.indexOf(":"),A=(E===-1?u:u.slice(0,E)).trim().toLowerCase(),I=(E===-1?"":u.slice(E+1).trim())||A;!ho.test(A)||c.has(A)||(c.add(A),p.push({id:A,label:I}))}return p},bo=r=>(Array.isArray(r)?r:[]).map(p=>p.label&&p.label!==p.id?`${p.id}: ${p.label}`:p.id).join(`
`),ht=r=>ho.test(String(r||"")),yo=r=>{if(!Array.isArray(r))return[];let p=[],c=new Set;for(let _ of r){if(!_||typeof _!="object")continue;let u=(_.id||"").toString().trim().toLowerCase();if(!ho.test(u)||c.has(u))continue;let E=(_.label||u).toString().trim()||u;c.add(u),p.push({id:u,label:E})}return p},An=r=>{let p={};for(let c of String(r||"").split(`
`)){let _=c.trim();if(!_)continue;let u=_.indexOf(":");if(u===-1)continue;let E=_.slice(0,u).trim(),A=_.slice(u+1).trim();!/^\d{12}$/.test(E)||!A||(p[E]=A)}return p},Rn=r=>Object.entries(r&&typeof r=="object"?r:{}).map(([p,c])=>`${p}: ${c}`).join(`
`),On=r=>{if(!r||typeof r!="object"||Array.isArray(r))return{};let p={};for(let[c,_]of Object.entries(r))/^\d{12}$/.test(c)&&typeof _=="string"&&_.trim()&&(p[c]=_.trim());return p},oa=40,na=24,Ie=r=>{let p=[],c=new Set;for(let _ of Array.isArray(r)?r:[]){let u=String(_??"").trim().replace(/\s+/g," ").slice(0,oa);if(!u)continue;let E=u.toLowerCase();if(!c.has(E)&&(c.add(E),p.push(u),p.length>=na))break}return p},$n=r=>{let p={};for(let c of String(r||"").split(`
`)){let _=c.trim();if(!_)continue;let u=_.indexOf(":");if(u===-1)continue;let E=_.slice(0,u).trim();if(!/^\d{12}$/.test(E))continue;let A=Ie(_.slice(u+1).split(","));A.length&&(p[E]=A)}return p},Cn=r=>Object.entries(r&&typeof r=="object"&&!Array.isArray(r)?r:{}).map(([p,c])=>`${p}: ${(Array.isArray(c)?c:[]).join(", ")}`).join(`
`),vo=r=>{if(!r||typeof r!="object"||Array.isArray(r))return{};let p={};for(let[c,_]of Object.entries(r)){if(!/^\d{12}$/.test(c))continue;let u=Ie(_);u.length&&(p[c]=u)}return p},Ln=r=>{let p=[],c=new Set;for(let _ of String(r||"").split(`
`)){let u=_.trim();if(!u)continue;let E=u.split("|").map(H=>H.trim());if(E.length<3)continue;let[A,...I]=E[1].split("/"),z=I.join("/").trim().slice(0,128),U=E[0].slice(0,64),G=E[2].slice(0,128);if(!U||!/^\d{12}$/.test(A)||!G)continue;let P=U.toLowerCase();if(c.has(P))continue;c.add(P);let rt=(E[3]||"").toLowerCase(),C={name:U,hub:A,role:G};z&&(C.hubRole=z),ht(rt)&&(C.region=rt),p.push(C)}return p},In=r=>(Array.isArray(r)?r:[]).map(p=>{let c=p.hubRole?`${p.hub}/${p.hubRole}`:p.hub,_=`${p.name} | ${c} | ${p.role}`;return p.region?`${_} | ${p.region}`:_}).join(`
`),Nn=r=>{if(!Array.isArray(r))return[];let p=[],c=new Set;for(let _ of r){if(!_||typeof _!="object")continue;let u=typeof _.name=="string"?_.name.trim().slice(0,64):"",E=typeof _.hub=="string"?_.hub.trim():"",A=typeof _.role=="string"?_.role.trim().slice(0,128):"";if(!u||!/^\d{12}$/.test(E)||!A)continue;let I=u.toLowerCase();if(c.has(I))continue;c.add(I);let z=typeof _.region=="string"?_.region.trim().toLowerCase():"",U=typeof _.hubRole=="string"?_.hubRole.trim().slice(0,128):"",G={name:u,hub:E,role:A};U&&(G.hubRole=U),ht(z)&&(G.region=z),p.push(G)}return p},xo=(r,p=6)=>{if(!Array.isArray(r))return[];let c=[];for(let _ of r){if(!_||typeof _!="object")continue;let u=typeof _.account=="string"?_.account.trim():"";if(!/^\d{12}$/.test(u))continue;let E=typeof _.org=="string"?_.org.trim().slice(0,64):"",A=typeof _.label=="string"?_.label.trim().slice(0,120):"",I=typeof _.role=="string"?_.role.trim().slice(0,128):"",z=typeof _.ts=="number"&&isFinite(_.ts)?_.ts:0;if(c.push({org:E,account:u,label:A,role:I,ts:z}),c.length>=p)break}return c},wo=(r,p)=>{let c=String(r??"").trim();if(!c)return!0;let _=String(p??"");if(c.length>=2&&c.startsWith('"')&&c.endsWith('"')){let A=c.slice(1,-1).toLowerCase();return A===""?!0:_.toLowerCase().includes(A)}let u=A=>A.toLowerCase().replace(/[^a-z0-9]/g,""),E=u(c);return E===""?!0:u(_).includes(E)},So=(r,p)=>{let c=p instanceof Set?p:new Set(p||[]),_=[],u=String(r??"").match(/(?:[^\s"]+|"[^"]*")+/g)||[];for(let E of u){let A=E,I=!1;A.length>1&&A[0]==="-"&&(I=!0,A=A.slice(1));let z="",U=A;if(A[0]!=='"'){let P=A.indexOf(":");P>0&&c.has(A.slice(0,P).toLowerCase())&&(z=A.slice(0,P).toLowerCase(),U=A.slice(P+1))}let G;U.length>=2&&U[0]==='"'&&U[U.length-1]==='"'?G=[{text:U.slice(1,-1),quoted:!0}]:G=U.split(",").map(P=>P.trim()).filter(Boolean).map(P=>{let rt=P.length>=2&&P[0]==='"'&&P[P.length-1]==='"';return{text:rt?P.slice(1,-1):P,quoted:rt}}),G.length&&_.push({field:z,negate:I,values:G})}return _},To=(r,p)=>{let c=p||{},_=(u,E)=>u.quoted?String(E??"").toLowerCase().includes(u.text.toLowerCase()):wo(u.text,E??"");for(let u of r){let E=(u.field?c[u.field]:c._all)||"",A=u.values.some(I=>_(I,E));if(u.negate?A:!A)return!1}return!0},ra=/^[A-Za-z0-9_\-?=&{}.%+][A-Za-z0-9/_\-?=&{}.%+#:]{0,255}$/,Vt=r=>{let p=String(r??"");return p===""?!0:ra.test(p)&&!p.includes("..")},Ne=(r,p=100)=>{if(!Array.isArray(r))return[];let c=[],_=new Set;for(let u of r){if(!u||typeof u!="object")continue;let E=typeof u.account=="string"?u.account.trim():"",A=typeof u.profile=="string"?u.profile.trim().slice(0,64):"";if(!/^\d{12}$/.test(E)||!A)continue;let I=`${E} ${A.toLowerCase()}`;if(_.has(I))continue;_.add(I);let z=typeof u.name=="string"?u.name.replace(/\|/g,"\xA6").trim().slice(0,64):"",U=typeof u.label=="string"?u.label.replace(/\|/g,"\xA6").trim().slice(0,120):"",G=typeof u.region=="string"?u.region.trim().toLowerCase():"",P=typeof u.service=="string"?u.service.trim():"";if(c.push({name:z,account:E,profile:A,region:ht(G)?G:"",service:P&&Vt(P)?P:"",label:U}),c.length>=p)break}return c},fe=(r,p)=>`jump::${r}::${encodeURIComponent(String(p||""))}`,aa=(r,p)=>{let c=String(r??"").trim();if(!c||/^console(\s+only)?$/i.test(c))return"";let _=c.toLowerCase();for(let u of Array.isArray(p)?p:[])if(!(!u||typeof u!="object")&&(String(u.id||"").toLowerCase()===_||String(u.name||"").toLowerCase()===_||String(u.path||"")===c))return String(u.path||"");return null},ia=(r,p)=>{let c=String(r??"");if(!c)return"";for(let _ of Array.isArray(p)?p:[])if(_&&typeof _=="object"&&String(_.path||"")===c)return String(_.name||_.id||c);return c},jn=(r,p)=>{let c=[];for(let _ of String(r||"").split(`
`)){let u=_.trim();if(!u)continue;let E=u.split("|").map(C=>C.trim());/^\d{12}$/.test(E[0]||"")&&!/^\d{12}$/.test(E[1]||"")&&(E=["",...E]);let[A="",I="",z="",U="",G="",...P]=E,rt=aa(G,p);c.push({name:A,account:I,profile:z,region:U,service:rt??"",label:P.join(" | ")})}return Ne(c)},Dn=(r,p)=>(Array.isArray(r)?r:[]).map(c=>{let _=[c.name||"",c.account,c.profile,c.region||"",ia(c.service,p),c.label||""];for(;_.length&&!_[_.length-1];)_.pop();return _[0]||_.shift(),_.join(" | ")}).join(`
`),B=20,ko=50,sa=/^[a-z0-9]{1,24}$/,ca=/^arn:aws[a-z-]*:iam::\d{12}:role\/[\w+=,.@/-]{1,512}$/,Eo=r=>ca.test(String(r||"")),pa=r=>(Array.isArray(r)?r:[]).filter(p=>p&&typeof p=="object"&&Eo(p.roleArn)).slice(0,B).map(p=>({roleArn:p.roleArn,service:typeof p.service=="string"&&Vt(p.service)?p.service:"",region:ht(p.region)?p.region:""})),he=r=>{if(!Array.isArray(r))return[];let p=[],c=new Set;for(let _ of r){if(!_||typeof _!="object")continue;let u=typeof _.id=="string"&&sa.test(_.id)?_.id:"";if(!u||c.has(u))continue;let E=typeof _.name=="string"?_.name.trim().slice(0,64):"";if(!E)continue;let A=typeof _.group=="string"?_.group.trim().slice(0,64):E,I=pa(_.tabs);if(!I.length)continue;let z=Number.isFinite(_.lastUsed)&&_.lastUsed>0?_.lastUsed:0;if(p.push({id:u,name:E,group:A,tabs:I,lastUsed:z}),c.add(u),p.length>=ko)break}return p},Mn=r=>new Set((r&&r.tabs||[]).map(p=>p.roleArn)).size;(async function(){"use strict";let r={SCRIPT_VERSION:chrome.runtime.getManifest().version,SCRIPT_HOMEPAGE_DEFAULT:"",DEFAULT_AWS_REGION:"eu-central-1",STS_DURATION:43200,TOAST_DURATION:3e3,TOAST_DURATION_SHORT:1500,TOAST_DURATION_LONG:2e3,SEARCH_DEBOUNCE_DELAY:300,ANIMATION_DURATION:300,STORAGE_KEYS:{THEME:"aws_theme",FAVORITES:"aws_favorites",SHORTCUTS:"aws_custom_shortcuts",COMPACT_MODE:"aws_compact_mode",SIGNIN_NEW_TAB:"aws_signin_new_tab",SERVICES:"aws_services",LAST_SERVICE:"aws_last_service",LAST_REGION:"aws_last_region",ENV_PATTERNS:"aws_env_patterns",ORG_PATTERNS:"aws_org_patterns",TYPE_PATTERNS:"aws_type_patterns",ROLE_PATTERNS:"aws_role_patterns",RECENT_ROLES:"aws_recent_roles",RECENT_LIMIT:"aws_recent_limit",ROLE_ORDER:"aws_role_order",TAB_GROUP_TAG:"aws_tab_group_tag",TAB_GROUP_MODE:"aws_tab_group_mode",AWS_REGION:"aws_region",REMEMBER_REGION:"aws_remember_region",REGION_LOCK:"aws_region_lock",REGION_LIST:"aws_region_list",ACCOUNT_NAMES:"aws_account_names",ACCOUNT_TAGS:"aws_account_tags",HOMEPAGE_URL:"aws_homepage_url",SIGNIN_CONFIRM_ROLE_KEYWORDS:"aws_signin_role_keywords",SIGNIN_CONFIRM_TYPE_IDS:"aws_signin_type_ids",WELCOME_SEEN:"hop_welcome_seen",START_VIEW:"aws_start_view",ASSUME_PROFILES:"aws_assume_profiles",JUMP_RECENTS:"aws_jump_recents",JUMP_PINNED:"aws_jump_pinned",JUMP_DESTS:"aws_jump_dests",LAUNCH_SETS:"aws_launch_sets"},TAB_GROUP_MODES:["role","org","off","custom"],TAB_GROUP_MODE_LABELS:{role:"By role",org:"By org",off:"Off",custom:"Custom tag"},DEFAULT_RECENT_LIMIT:10,DEFAULT_ENV_PATTERNS:[{id:"prod",label:"PROD",color:"#dc3545",patterns:["prod","production"]},{id:"test",label:"TEST",color:"#ffc107",patterns:["test","staging"]},{id:"dev",label:"DEV",color:"#28a745",patterns:["dev","development"]}],DEFAULT_ORG_PATTERNS:[{id:"org-a",label:"Org A",color:"#0073bb",patterns:[]},{id:"org-b",label:"Org B",color:"#6610f2",patterns:[]},{id:"org-c",label:"Org C",color:"#17a2b8",patterns:[]}],DEFAULT_TYPE_PATTERNS:[{id:"management",label:"Management",color:"#dc3545",patterns:["management","master","payer"]},{id:"security",label:"Security",color:"#dc3545",patterns:["security","audit"]},{id:"logging",label:"Logging",color:"#dc3545",patterns:["log","logging","logarchive"]},{id:"network",label:"Network",color:"#6c757d",patterns:["network","transit"]}],DEFAULT_ROLE_PATTERNS:[{id:"admin",label:"Admin",color:"#dc3545",patterns:["admin"]},{id:"poweruser",label:"PowerUser",color:"#0073bb",patterns:["poweruser","power-user"]},{id:"readonly",label:"ReadOnly",color:"#28a745",patterns:["readonly","read-only","viewonly"]}],DEFAULT_SIGNIN_CONFIRM_ROLE_KEYWORDS:["admin"],DEFAULT_SIGNIN_CONFIRM_TYPE_IDS:[],DEFAULT_SERVICES:[{id:"cloudwatch",name:"CloudWatch",path:"cloudwatch/home?region={region}"},{id:"s3",name:"S3",path:"s3/home?region={region}"},{id:"ec2",name:"EC2",path:"ec2/home?region={region}"},{id:"iam",name:"IAM",path:"iam/home"},{id:"lambda",name:"Lambda",path:"lambda/home?region={region}"},{id:"cloudformation",name:"CloudFormation",path:"cloudformation/home?region={region}"},{id:"vpc",name:"VPC",path:"vpcconsole/home?region={region}"},{id:"rds",name:"RDS",path:"rds/home?region={region}"}],DEFAULT_REGION_LIST:[{id:"eu-central-1",label:"Europe (Frankfurt)"},{id:"eu-west-1",label:"Europe (Ireland)"},{id:"eu-west-2",label:"Europe (London)"},{id:"eu-west-3",label:"Europe (Paris)"},{id:"eu-north-1",label:"Europe (Stockholm)"},{id:"us-east-1",label:"US East (N. Virginia)"},{id:"us-east-2",label:"US East (Ohio)"},{id:"us-west-1",label:"US West (N. California)"},{id:"us-west-2",label:"US West (Oregon)"},{id:"ca-central-1",label:"Canada (Central)"},{id:"sa-east-1",label:"South America (S\xE3o Paulo)"},{id:"ap-south-1",label:"Asia Pacific (Mumbai)"},{id:"ap-northeast-1",label:"Asia Pacific (Tokyo)"},{id:"ap-northeast-2",label:"Asia Pacific (Seoul)"},{id:"ap-northeast-3",label:"Asia Pacific (Osaka)"},{id:"ap-southeast-1",label:"Asia Pacific (Singapore)"},{id:"ap-southeast-2",label:"Asia Pacific (Sydney)"}],THEMES:{light:{name:"Light",icon:"\u2600\uFE0F",next:"dark"},dark:{name:"Dark",icon:"\u{1F319}",next:"auto"},auto:{name:"System",icon:"\u{1F5A5}\uFE0F",next:"light"}},SELECTORS:{SAML_FORM:"#saml_form",SAML_ROLES:".saml-role",SAML_RESPONSE:'input[name="SAMLResponse"]',SIGNIN_BUTTON:"#signin_button",RADIO_BUTTONS:'input[type="radio"]',THEME_TOGGLE:"#tm_theme_toggle",COMPACT_TOGGLE:"#tm_compact_toggle",SIGNIN_TAB_TOGGLE:"#tm_signin_tab_toggle",SEARCH_INPUT:"#tm_search_input",FAVORITE_BUTTONS:".tm_favorite_button",FILTER_BUTTONS:".tm_filter_button",SHORTCUTS_SECTION:".tm_shortcuts_section .tm_button_group",CUSTOM_SHORTCUTS:".tm_custom_shortcut"}},p=!1,c=(...t)=>{p&&[...t]},_=(t,e)=>{let o;return function(...n){clearTimeout(o),o=setTimeout(()=>t.apply(this,n),e)}},u=async(t,e=null)=>{try{return await t()}catch(o){return console.error("Storage operation failed:",o),e}},E={},A=t=>(E[t]||(E[t]=i(t)),E[t]),I=()=>{E={}};await new Promise(t=>{typeof i<"u"?i(document).ready(t):document.readyState==="loading"?document.addEventListener("DOMContentLoaded",t):t()}),c(`Console Hopper v${r.SCRIPT_VERSION}`);let z=["org","env","type","role","source","show","tag"],U=z.filter(t=>t!=="show"),G=()=>z.reduce((t,e)=>(t[e]=[],t),{}),P=(t,e)=>{let o=t||{};return z.reduce((n,a)=>{let s=Array.isArray(o[a])?o[a]:[];return n[a]=e?s.filter(l=>typeof l=="string"):[...s],n},{})},rt=(t,e)=>{if(!t||!e||String(t.search||"")!==String(e.search||""))return!1;let o=t.filters||{},n=e.filters||{};return z.every(a=>{let s=[...Array.isArray(o[a])?o[a]:[]].sort(),l=[...Array.isArray(n[a])?n[a]:[]].sort();return s.length===l.length&&s.every((m,h)=>m===l[h])})},C=G(),H="",Ao=0,W=-1,Lt=[],Gn=/mac/i.test(navigator.userAgentData&&navigator.userAgentData.platform||navigator.platform||""),kt=[],at=[],ce=[],je=[],Ro=[],Oo=[],It="us-east-1",Nt=!0,qt=!0,Gt="",Xt=["admin"],Et=[],mt=[],pe=10,Pt=[],it="",st="role",zt=!1,Qt=!1,dt="light",S=(t,e="info",o=r.TOAST_DURATION)=>{let n=i(`<div class="tm_toast ${e}">${nt(t)}</div>`);i("body").append(n),setTimeout(()=>n.fadeOut(500,()=>n.remove()),o)},$o=async t=>{try{if(!navigator.clipboard)throw new Error("Clipboard API not available");return await navigator.clipboard.writeText(t),!0}catch(e){return console.error("Clipboard operation failed:",e),!1}},Co=t=>(t||"").toString().toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")||`entry-${Math.floor(Math.random()*1e6).toString(36)}`,Pn=(t,e)=>{let o=new Set(e);if(!o.has(t))return t;let n=2;for(;o.has(`${t}-${n}`);)n++;return`${t}-${n}`},Lo=["#0073bb","#6c757d","#17a2b8","#28a745","#ffc107","#dc3545","#6610f2","#e83e8c"],zn=(t,e)=>{let o=Array.isArray(e)?e:[],n=Object.create(null);o.forEach(s=>{n[s.id]=s});let a=s=>Lo[s%Lo.length];return Array.isArray(t)?t.filter(s=>s&&typeof s=="object").map((s,l)=>{let m=(s.id||Co(s.label)||`entry-${l}`).toString(),h=(s.label||m).toString(),T=s.color&&/^#[0-9a-fA-F]{3,8}$/.test(s.color)?s.color:n[m]&&n[m].color||a(l),w=Array.isArray(s.patterns)?s.patterns.map(R=>(R||"").toString().trim()).filter(Boolean):[];return{id:m,label:h,color:T,patterns:w}}):t&&typeof t=="object"?Object.keys(t).map((s,l)=>{let m=n[s];return{id:s,label:m&&m.label||s.toString().toUpperCase(),color:m&&m.color||a(l),patterns:Array.isArray(t[s])?t[s].map(h=>(h||"").toString().trim()).filter(Boolean):[]}}):[]},k={async getTheme(){return await u(async()=>(await chrome.storage.local.get(r.STORAGE_KEYS.THEME))[r.STORAGE_KEYS.THEME]??"light","light")},async saveTheme(t){return await u(async()=>(await chrome.storage.local.set({[r.STORAGE_KEYS.THEME]:t}),!0),!1)},async getFavorites(){let t=await u(async()=>(await chrome.storage.local.get(r.STORAGE_KEYS.FAVORITES))[r.STORAGE_KEYS.FAVORITES]??"[]","[]");try{let e=typeof t=="string"?JSON.parse(t):t;return Array.isArray(e)?e:[]}catch(e){return console.error("Error parsing favorites:",e),[]}},async saveFavorites(t){return await u(async()=>(await chrome.storage.local.set({[r.STORAGE_KEYS.FAVORITES]:JSON.stringify(t)}),!0),!1)},async getCustomShortcuts(){let t=await u(async()=>(await chrome.storage.local.get(r.STORAGE_KEYS.SHORTCUTS))[r.STORAGE_KEYS.SHORTCUTS]??"[]","[]");try{let e=typeof t=="string"?JSON.parse(t):t;return Array.isArray(e)?e.filter(o=>o&&typeof o=="object"&&typeof o.label=="string"&&typeof o.search=="string"):[]}catch(e){return console.error("Error parsing shortcuts:",e),[]}},async saveCustomShortcuts(t){return await u(async()=>(await chrome.storage.local.set({[r.STORAGE_KEYS.SHORTCUTS]:JSON.stringify(t)}),!0),!1)},async getCompactMode(){return await u(async()=>(await chrome.storage.local.get(r.STORAGE_KEYS.COMPACT_MODE))[r.STORAGE_KEYS.COMPACT_MODE]??!1,!1)},async saveCompactMode(t){return await u(async()=>(await chrome.storage.local.set({[r.STORAGE_KEYS.COMPACT_MODE]:t}),!0),!1)},async getSigninNewTab(){return await u(async()=>(await chrome.storage.local.get(r.STORAGE_KEYS.SIGNIN_NEW_TAB))[r.STORAGE_KEYS.SIGNIN_NEW_TAB]??!1,!1)},async saveSigninNewTab(t){return await u(async()=>(await chrome.storage.local.set({[r.STORAGE_KEYS.SIGNIN_NEW_TAB]:t}),!0),!1)},async getServices(){let t=await u(async()=>(await chrome.storage.local.get(r.STORAGE_KEYS.SERVICES))[r.STORAGE_KEYS.SERVICES]??null,null);if(!t)return[...r.DEFAULT_SERVICES];try{return typeof t=="string"?JSON.parse(t):t}catch(e){return console.error("Error parsing services:",e),[...r.DEFAULT_SERVICES]}},async saveServices(t){return await u(async()=>(await chrome.storage.local.set({[r.STORAGE_KEYS.SERVICES]:JSON.stringify(t)}),!0),!1)},async _getPatternList(t,e){let o=await u(async()=>(await chrome.storage.local.get(t))[t]??null,null);if(o==null)return JSON.parse(JSON.stringify(e));let n=o;if(typeof o=="string")try{n=JSON.parse(o)}catch(a){return console.error(`Error parsing ${t}:`,a),JSON.parse(JSON.stringify(e))}return zn(n,e)},async _savePatternList(t,e){return await u(async()=>(await chrome.storage.local.set({[t]:JSON.stringify(e)}),!0),!1)},getEnvPatterns(){return this._getPatternList(r.STORAGE_KEYS.ENV_PATTERNS,r.DEFAULT_ENV_PATTERNS)},saveEnvPatterns(t){return this._savePatternList(r.STORAGE_KEYS.ENV_PATTERNS,t)},getOrgPatterns(){return this._getPatternList(r.STORAGE_KEYS.ORG_PATTERNS,r.DEFAULT_ORG_PATTERNS)},saveOrgPatterns(t){return this._savePatternList(r.STORAGE_KEYS.ORG_PATTERNS,t)},getTypePatterns(){return this._getPatternList(r.STORAGE_KEYS.TYPE_PATTERNS,r.DEFAULT_TYPE_PATTERNS)},saveTypePatterns(t){return this._savePatternList(r.STORAGE_KEYS.TYPE_PATTERNS,t)},getRolePatterns(){return this._getPatternList(r.STORAGE_KEYS.ROLE_PATTERNS,r.DEFAULT_ROLE_PATTERNS)},saveRolePatterns(t){return this._savePatternList(r.STORAGE_KEYS.ROLE_PATTERNS,t)},async getAwsRegion(){return await u(async()=>{let e=(await chrome.storage.local.get(r.STORAGE_KEYS.AWS_REGION))[r.STORAGE_KEYS.AWS_REGION];return typeof e=="string"&&e.trim()?e.trim():r.DEFAULT_AWS_REGION},r.DEFAULT_AWS_REGION)},async saveAwsRegion(t){return await u(async()=>(await chrome.storage.local.set({[r.STORAGE_KEYS.AWS_REGION]:t}),!0),!1)},async getRememberRegion(){return await u(async()=>(await chrome.storage.local.get(r.STORAGE_KEYS.REMEMBER_REGION))[r.STORAGE_KEYS.REMEMBER_REGION]??!0,!0)},async saveRememberRegion(t){return await u(async()=>(await chrome.storage.local.set({[r.STORAGE_KEYS.REMEMBER_REGION]:!!t}),!0),!1)},async getRegionLock(){return await u(async()=>(await chrome.storage.local.get(r.STORAGE_KEYS.REGION_LOCK))[r.STORAGE_KEYS.REGION_LOCK]??!0,!0)},async saveRegionLock(t){return await u(async()=>(await chrome.storage.local.set({[r.STORAGE_KEYS.REGION_LOCK]:!!t}),!0),!1)},async getRegionList(){let t=await u(async()=>(await chrome.storage.local.get(r.STORAGE_KEYS.REGION_LIST))[r.STORAGE_KEYS.REGION_LIST]??null,null),e=t;if(typeof t=="string")try{e=JSON.parse(t)}catch(n){console.error("Error parsing region list:",n),e=null}let o=yo(e);return o.length?o:yo(r.DEFAULT_REGION_LIST)},async getAssumeProfiles(){let t=await u(async()=>(await chrome.storage.local.get(r.STORAGE_KEYS.ASSUME_PROFILES))[r.STORAGE_KEYS.ASSUME_PROFILES]??null,null),e=t;if(typeof t=="string")try{e=JSON.parse(t)}catch(o){console.error("Error parsing assume profiles:",o),e=null}return Nn(e)},async saveAssumeProfiles(t){return await u(async()=>(await chrome.storage.local.set({[r.STORAGE_KEYS.ASSUME_PROFILES]:JSON.stringify(t)}),!0),!1)},async getJumpDests(){let t=await u(async()=>(await chrome.storage.local.get(r.STORAGE_KEYS.JUMP_DESTS))[r.STORAGE_KEYS.JUMP_DESTS]??null,null),e=t;if(typeof t=="string")try{e=JSON.parse(t)}catch(o){console.error("Error parsing jump destinations:",o),e=null}return Ne(e)},async saveJumpDests(t){return await u(async()=>(await chrome.storage.local.set({[r.STORAGE_KEYS.JUMP_DESTS]:JSON.stringify(t)}),!0),!1)},async getLaunchSets(){let t=await u(async()=>(await chrome.storage.local.get(r.STORAGE_KEYS.LAUNCH_SETS))[r.STORAGE_KEYS.LAUNCH_SETS]??null,null);return he(t)},async saveLaunchSets(t){return await u(async()=>(await chrome.storage.local.set({[r.STORAGE_KEYS.LAUNCH_SETS]:t}),!0),!1)},async getJumpRecents(){let t=await u(async()=>(await chrome.storage.local.get(r.STORAGE_KEYS.JUMP_RECENTS))[r.STORAGE_KEYS.JUMP_RECENTS]??null,null),e=t;if(typeof t=="string")try{e=JSON.parse(t)}catch{e=null}return xo(e)},async saveJumpRecents(t){return await u(async()=>(await chrome.storage.local.set({[r.STORAGE_KEYS.JUMP_RECENTS]:JSON.stringify(t)}),!0),!1)},async getJumpPinned(){let t=await u(async()=>(await chrome.storage.local.get(r.STORAGE_KEYS.JUMP_PINNED))[r.STORAGE_KEYS.JUMP_PINNED]??null,null),e=t;if(typeof t=="string")try{e=JSON.parse(t)}catch{e=null}return xo(e,12)},async saveJumpPinned(t){return await u(async()=>(await chrome.storage.local.set({[r.STORAGE_KEYS.JUMP_PINNED]:JSON.stringify(t)}),!0),!1)},async saveRegionList(t){return await u(async()=>(await chrome.storage.local.set({[r.STORAGE_KEYS.REGION_LIST]:JSON.stringify(t)}),!0),!1)},async getAccountNames(){let t=await u(async()=>(await chrome.storage.local.get(r.STORAGE_KEYS.ACCOUNT_NAMES))[r.STORAGE_KEYS.ACCOUNT_NAMES]??null,null);return On(t)},async saveAccountNames(t){return await u(async()=>(await chrome.storage.local.set({[r.STORAGE_KEYS.ACCOUNT_NAMES]:t}),!0),!1)},async getAccountTags(){let t=await u(async()=>(await chrome.storage.local.get(r.STORAGE_KEYS.ACCOUNT_TAGS))[r.STORAGE_KEYS.ACCOUNT_TAGS]??null,null);return vo(t)},async saveAccountTags(t){return await u(async()=>(await chrome.storage.local.set({[r.STORAGE_KEYS.ACCOUNT_TAGS]:t}),!0),!1)},async getHomepageUrl(){return await u(async()=>{let e=(await chrome.storage.local.get(r.STORAGE_KEYS.HOMEPAGE_URL))[r.STORAGE_KEYS.HOMEPAGE_URL];return typeof e=="string"?e:r.SCRIPT_HOMEPAGE_DEFAULT},r.SCRIPT_HOMEPAGE_DEFAULT)},async saveHomepageUrl(t){return await u(async()=>(await chrome.storage.local.set({[r.STORAGE_KEYS.HOMEPAGE_URL]:t}),!0),!1)},async getSigninConfirmRoleKeywords(){return await u(async()=>{let e=(await chrome.storage.local.get(r.STORAGE_KEYS.SIGNIN_CONFIRM_ROLE_KEYWORDS))[r.STORAGE_KEYS.SIGNIN_CONFIRM_ROLE_KEYWORDS];if(Array.isArray(e))return e.map(o=>(o||"").toString().trim()).filter(Boolean);if(typeof e=="string")try{let o=JSON.parse(e);if(Array.isArray(o))return o.map(n=>(n||"").toString().trim()).filter(Boolean)}catch{}return[...r.DEFAULT_SIGNIN_CONFIRM_ROLE_KEYWORDS]},[...r.DEFAULT_SIGNIN_CONFIRM_ROLE_KEYWORDS])},async saveSigninConfirmRoleKeywords(t){return await u(async()=>(await chrome.storage.local.set({[r.STORAGE_KEYS.SIGNIN_CONFIRM_ROLE_KEYWORDS]:JSON.stringify(t)}),!0),!1)},async getSigninConfirmTypeIds(){return await u(async()=>{let e=(await chrome.storage.local.get(r.STORAGE_KEYS.SIGNIN_CONFIRM_TYPE_IDS))[r.STORAGE_KEYS.SIGNIN_CONFIRM_TYPE_IDS];if(Array.isArray(e))return e.map(o=>(o||"").toString().trim()).filter(Boolean);if(typeof e=="string")try{let o=JSON.parse(e);if(Array.isArray(o))return o.map(n=>(n||"").toString().trim()).filter(Boolean)}catch{}return[...r.DEFAULT_SIGNIN_CONFIRM_TYPE_IDS]},[...r.DEFAULT_SIGNIN_CONFIRM_TYPE_IDS])},async saveSigninConfirmTypeIds(t){return await u(async()=>(await chrome.storage.local.set({[r.STORAGE_KEYS.SIGNIN_CONFIRM_TYPE_IDS]:JSON.stringify(t)}),!0),!1)},async getWelcomeSeen(){return await u(async()=>(await chrome.storage.local.get(r.STORAGE_KEYS.WELCOME_SEEN))[r.STORAGE_KEYS.WELCOME_SEEN]===!0,!1)},async saveWelcomeSeen(t){return await u(async()=>(await chrome.storage.local.set({[r.STORAGE_KEYS.WELCOME_SEEN]:!!t}),!0),!1)},async getRecentRoles(){let t=await u(async()=>(await chrome.storage.local.get(r.STORAGE_KEYS.RECENT_ROLES))[r.STORAGE_KEYS.RECENT_ROLES]??"[]","[]");try{let e=typeof t=="string"?JSON.parse(t):t;return Array.isArray(e)?e:[]}catch(e){return console.error("Error parsing recent roles:",e),[]}},async saveRecentRoles(t){return await u(async()=>(await chrome.storage.local.set({[r.STORAGE_KEYS.RECENT_ROLES]:JSON.stringify(t)}),!0),!1)},async getRecentLimit(){return await u(async()=>{let e=(await chrome.storage.local.get(r.STORAGE_KEYS.RECENT_LIMIT))[r.STORAGE_KEYS.RECENT_LIMIT];return typeof e!="number"||!Number.isFinite(e)||e<=0?r.DEFAULT_RECENT_LIMIT:Math.min(Math.max(1,Math.floor(e)),100)},r.DEFAULT_RECENT_LIMIT)},async saveRecentLimit(t){return await u(async()=>(await chrome.storage.local.set({[r.STORAGE_KEYS.RECENT_LIMIT]:t}),!0),!1)},async getRoleOrder(){let t=await u(async()=>(await chrome.storage.local.get(r.STORAGE_KEYS.ROLE_ORDER))[r.STORAGE_KEYS.ROLE_ORDER]??"[]","[]");try{let e=typeof t=="string"?JSON.parse(t):t;return Array.isArray(e)?e:[]}catch(e){return console.error("Error parsing role order:",e),[]}},async saveRoleOrder(t){return await u(async()=>(await chrome.storage.local.set({[r.STORAGE_KEYS.ROLE_ORDER]:JSON.stringify(t)}),!0),!1)},async getTabGroupTag(){return await u(async()=>(await chrome.storage.local.get(r.STORAGE_KEYS.TAB_GROUP_TAG))[r.STORAGE_KEYS.TAB_GROUP_TAG]??"","")},async saveTabGroupTag(t){return await u(async()=>(await chrome.storage.local.set({[r.STORAGE_KEYS.TAB_GROUP_TAG]:t}),!0),!1)},async getStartView(){return await u(async()=>(await chrome.storage.local.get(r.STORAGE_KEYS.START_VIEW))[r.STORAGE_KEYS.START_VIEW]??null,null)},async saveStartView(t){return await u(async()=>(await chrome.storage.local.set({[r.STORAGE_KEYS.START_VIEW]:t}),!0),!1)},async clearStartView(){return await u(async()=>(await chrome.storage.local.remove(r.STORAGE_KEYS.START_VIEW),!0),!1)},async getTabGroupMode(){return await u(async()=>{let e=(await chrome.storage.local.get(r.STORAGE_KEYS.TAB_GROUP_MODE))[r.STORAGE_KEYS.TAB_GROUP_MODE];return r.TAB_GROUP_MODES.includes(e)?e:"role"},"role")},async saveTabGroupMode(t){return await u(async()=>(await chrome.storage.local.set({[r.STORAGE_KEYS.TAB_GROUP_MODE]:t}),!0),!1)},async getLastService(t){let e=await u(async()=>(await chrome.storage.local.get(r.STORAGE_KEYS.LAST_SERVICE))[r.STORAGE_KEYS.LAST_SERVICE]??{},{});return typeof e=="object"&&e[t]||""},async saveLastService(t,e){let o=await u(async()=>(await chrome.storage.local.get(r.STORAGE_KEYS.LAST_SERVICE))[r.STORAGE_KEYS.LAST_SERVICE]??{},{}),n=typeof o=="object"?o:{};return n[t]=e,await u(async()=>(await chrome.storage.local.set({[r.STORAGE_KEYS.LAST_SERVICE]:n}),!0),!1)},async saveLastRegion(t,e){let o=await u(async()=>(await chrome.storage.local.get(r.STORAGE_KEYS.LAST_REGION))[r.STORAGE_KEYS.LAST_REGION]??{},{}),n=typeof o=="object"?o:{};return n[t]=e,await u(async()=>(await chrome.storage.local.set({[r.STORAGE_KEYS.LAST_REGION]:n}),!0),!1)}},Ut={detectSystemTheme(){return window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"},getEffectiveTheme(t=dt){return t==="auto"?this.detectSystemTheme():t},async applyTheme(t,{notify:e=!1}={}){let o=this.getEffectiveTheme(t);i("body").removeClass("tm_theme_light tm_theme_dark"),i("body").addClass(`tm_theme_${o}`);let n=r.THEMES[t];n&&(A(r.SELECTORS.THEME_TOGGLE).text(`Theme: ${n.name}`),e&&S(`Theme: ${n.name}`,"info",r.TOAST_DURATION_SHORT))},async toggleTheme(){dt=r.THEMES[dt]?.next||"light",await k.saveTheme(dt)!==!1?await this.applyTheme(dt,{notify:!0}):S("Failed to save theme preference","error")}},le={bg:{from:["white","#ffffff","#fff"],to:"#2d3748"},softBox:{from:["#f8f9fa","#fafbfc"],to:"#3a4252"},border:{from:["#e1e4e8","#ccc","#adb5bd"],to:"#4a5568"},text:{from:["#16191f","#000","#212529"],to:"#e9ecef"},muted:{from:["#6c757d","#4a5568"],to:"#a0aec0"}},Un=t=>{t.dataset.tmOrigStyle===void 0&&(t.dataset.tmOrigStyle=t.getAttribute("style")||"")},Io=(t,e)=>{let o=(t.getAttribute("style")||"").toLowerCase();o&&(Un(t),e?(/background\s*:\s*(white|#fff|#ffffff)/.test(o)?t.style.setProperty("background",le.bg.to,"important"):/background\s*:\s*#f8f9fa|background\s*:\s*#fafbfc/.test(o)&&t.style.setProperty("background",le.softBox.to,"important"),/color\s*:\s*#16191f|color\s*:\s*#000\b|color\s*:\s*#212529/.test(o)?t.style.setProperty("color",le.text.to,"important"):/color\s*:\s*#6c757d/.test(o)&&t.style.setProperty("color",le.muted.to,"important"),/border\s*:\s*1px solid #e1e4e8|border\s*:\s*1px solid #ccc|border-color\s*:\s*#e1e4e8|border-color\s*:\s*#ccc/.test(o)&&t.style.setProperty("border-color",le.border.to,"important")):t.setAttribute("style",t.dataset.tmOrigStyle||""))},De=t=>{if(!t||!t.querySelectorAll)return;let e=document.body.classList.contains("tm_theme_dark");Io(t,e),t.querySelectorAll("*").forEach(o=>Io(o,e))},Fn=new MutationObserver(t=>{for(let e of t)for(let o of e.addedNodes){if(o.nodeType!==1)continue;if(o.id&&/_modal$/.test(o.id)){De(o);continue}o.closest&&o.closest('[id$="_modal"]')&&De(o)}}),Hn=()=>{document.querySelectorAll('[id$="_modal"]').forEach(De)},Kn=Ut.applyTheme.bind(Ut);Ut.applyTheme=async function(t,e){await Kn(t,e),Hn()};let Zt={async loadCache(){c("Loading favorites into cache..."),kt=await k.getFavorites(),c("Favorites cache loaded:",kt)},async saveFavorites(t){return await k.saveFavorites(t)!==!1?(kt=[...t],c("Updated favorites cache:",kt),!0):(S("Failed to save favorites","error"),!1)},isFavoriteSync(t){return kt.includes(t)},async toggleFavorite(t,e,o){c(`toggleFavorite called: ${t}, ${e}, ${o}`);let n=[...kt],a=n.indexOf(t);a>-1?(n.splice(a,1),S(`Removed ${e}/${o} from favorites`,"info",r.TOAST_DURATION_LONG)):(n.push(t),S(`Added ${e}/${o} to favorites`,"success",r.TOAST_DURATION_LONG)),await this.saveFavorites(n)&&await this.updateButtons()},async updateButtons(){c("Updating favorite buttons..."),c("Current favorites cache for button update:",kt),A(r.SELECTORS.FAVORITE_BUTTONS).each(function(){let t=i(this),e=t.data("role-arn"),o=Zt.isFavoriteSync(e);t.text(o?"\u2605":"\u2606").toggleClass("favorited",o).attr("title",o?"Remove from favorites":"Add to favorites")})}},ct={async loadCache(){c("Loading custom shortcuts into cache..."),at=await k.getCustomShortcuts(),c("Custom shortcuts cache loaded:",at)},async saveShortcuts(t){return await k.saveCustomShortcuts(t)!==!1?(at=[...t],c("Updated shortcuts cache:",at),!0):(S("Failed to save shortcuts","error"),!1)},idOf(t){return nt(String(t||"")).toLowerCase().replace(/[^a-z0-9]/g,"")},uniqueId(t,e){let o=this.idOf(t)||"shortcut",n=o,a=2;for(;e.has(n);)n=`${o}${a}`,a+=1;return n},idFor(t){return t&&t.id||this.idOf(t&&t.label)},findByFilter(t){let e=String(t||"");return at.find(o=>`custom_${this.idFor(o)}`===e)||null},generateHTML(){let t='<a href="#" class="tm_filter_button" data-group="show" data-filter="favorites">Favorites</a><a href="#" class="tm_filter_button" data-group="show" data-filter="recent">Recent</a>';return at.forEach(e=>{let o=nt(this.idFor(e)),n=nt(e.search||""),a=nt(e.label);t+=`<a href="#" class="tm_filter_button tm_custom_shortcut" data-group="show" data-filter="custom_${o}" data-search="${n}">${a}<span class="tm_shortcut_del" role="button" tabindex="-1" title="Remove shortcut" aria-label="Remove shortcut">\u2715</span></a>`}),t},updateSection(){A(r.SELECTORS.SHORTCUTS_SECTION).html(this.generateHTML())},isActive(t){return rt(t,yt.capture())},refreshActive(){let t=yt.capture();i(r.SELECTORS.CUSTOM_SHORTCUTS).each(function(){let e=ct.findByFilter(i(this).data("filter"));i(this).toggleClass("active",rt(e,t))})},applyShortcut(t){t&&(this.isActive(t)?K.clearAll():yt.apply({search:t.search||"",filters:t.filters||{}},!1),this.refreshActive())},async addCurrent(t){let e=String(t||"").trim();if(!e)return!1;let o=yt.capture();o.filters.show=o.filters.show.filter(l=>!String(l).startsWith("custom_"));let n=new Set(at.map(l=>this.idFor(l))),a=[...at,{id:this.uniqueId(e,n),label:e,search:o.search,filters:o.filters}],s=await this.saveShortcuts(a);return s&&(this.updateSection(),re(),this.refreshActive()),s},async remove(t){if(!t)return!1;let e=this.idFor(t),o=at.filter(a=>this.idFor(a)!==e),n=await this.saveShortcuts(o);return n&&(this.updateSection(),re(),this.refreshActive()),n}},me={async loadSetting(){zt=await k.getCompactMode(),c("Loaded compact mode:",zt)},async saveSetting(t){return await k.saveCompactMode(t)!==!1?(zt=t,this.apply(),!0):(S("Failed to save compact mode","error"),!1)},apply(){zt?(i("body").addClass("tm_compact_mode"),c("Applied compact mode")):(i("body").removeClass("tm_compact_mode"),c("Removed compact mode"))},updateButton(){A(r.SELECTORS.COMPACT_TOGGLE).text(`Compact: ${zt?"On":"Off"}`)}},be={async loadSetting(){Qt=await k.getSigninNewTab(),c("Loaded sign-in new-tab default:",Qt)},async saveSetting(t){return await k.saveSigninNewTab(t)!==!1?(Qt=t,!0):(S("Failed to save sign-in tab setting","error"),!1)},updateButton(){A(r.SELECTORS.SIGNIN_TAB_TOGGLE).text(`Sign-in: ${Qt?"New tab":"Same tab"}`)}},At=[],te={},V={async loadCache(){c("Loading services into cache..."),At=await k.getServices(),c("Services cache loaded:",At)},async loadLastServicesCache(){te=(await chrome.storage.local.get(r.STORAGE_KEYS.LAST_SERVICE))[r.STORAGE_KEYS.LAST_SERVICE]??{},c("Last services cache loaded:",te)},async saveServices(t){return await k.saveServices(t)!==!1?(At=[...t],c("Updated services cache:",At),!0):(S("Failed to save services","error"),!1)},async saveLastService(t,e){te[t]=e,await k.saveLastService(t,e)},getLastServiceSync(t){return te[t]||""},hasLastServiceSync(t){return Object.prototype.hasOwnProperty.call(te,t)},async clearLastService(t){this.hasLastServiceSync(t)&&(delete te[t],await u(async()=>{let o=(await chrome.storage.local.get(r.STORAGE_KEYS.LAST_SERVICE))[r.STORAGE_KEYS.LAST_SERVICE]??{};delete o[t],await chrome.storage.local.set({[r.STORAGE_KEYS.LAST_SERVICE]:o})}))},getServicesSync(){return At},generateDropdownHTML(t,e){let o=this.getLastServiceSync(t),n=v(t),a=v(e);return`
        <select class="tm_service_dropdown" data-role-arn="${n}" data-account-id="${a}">
          ${this.serviceOptionsHTML(o)}
        </select>
      `},serviceOptionsHTML(t){let e=At.map(o=>{let n=o&&typeof o.path=="string"?o.path:"",a=o&&typeof o.name=="string"?o.name:"";return`<option value="${v(n)}"${n===t?" selected":""}>${v(a)}</option>`}).join("");return`<option value=""${t?"":" selected"}>Console only</option>${e}`}},Ft=[],ee={},No="__hop_jump__",Q={async loadCache(){Ft=await k.getRegionList(),c("Region list cache loaded:",Ft)},async loadLastRegionsCache(){ee=(await chrome.storage.local.get(r.STORAGE_KEYS.LAST_REGION))[r.STORAGE_KEYS.LAST_REGION]??{},c("Last regions cache loaded:",ee)},async saveRegions(t){return await k.saveRegionList(t)!==!1?(Ft=[...t],!0):(S("Failed to save regions","error"),!1)},async saveLastRegion(t,e){ee[t]=e,await k.saveLastRegion(t,e)},getLastRegionSync(t){return ee[t]||""},async clearLastRegion(t){Object.prototype.hasOwnProperty.call(ee,t)&&(delete ee[t],await u(async()=>{let o=(await chrome.storage.local.get(r.STORAGE_KEYS.LAST_REGION))[r.STORAGE_KEYS.LAST_REGION]??{};delete o[t],await chrome.storage.local.set({[r.STORAGE_KEYS.LAST_REGION]:o})}))},list(){return Ft},regionOptionsHTML(t){let e=Ft.slice();return t&&!e.some(o=>o.id===t)&&e.unshift({id:t,label:t}),e.map(o=>`<option value="${v(o.id)}"${o.id===t?" selected":""}>${v(o.label)}</option>`).join("")},generateRegionDropdownHTML(t){let e=X.region()||r.DEFAULT_AWS_REGION,o=X.rememberRegion()&&this.getLastRegionSync(t)||e;return`
        <select class="tm_region_dropdown" data-role-arn="${v(t)}" title="AWS region for this sign-in">
          ${this.regionOptionsHTML(o)}
        </select>
      `},jumpRegionSelected(){let t=X.region()||r.DEFAULT_AWS_REGION;return X.rememberRegion()&&this.getLastRegionSync(No)||t}},Ht=[],Rt=[],ut=[],ye=[],oe=!1,_t={async loadCache(){Ht=await k.getAssumeProfiles(),c("Assume profiles cache loaded:",Ht)},async save(t){return await k.saveAssumeProfiles(t)!==!1?(Ht=[...t],!0):(S("Failed to save assume profiles","error"),!1)},all(){return Ht},byName(t){return Ht.find(e=>e.name===t)||null},optionsHTML(){return Ht.map(t=>`<option value="${v(t.name)}">${v(t.name)}</option>`).join("")}},q={async loadCache(){Rt=await k.getJumpDests(),c("Jump destinations cache loaded:",Rt.length,"entries")},_chain:Promise.resolve(),_enqueue(t){let e=this._chain.then(t,t);return this._chain=e.then(()=>{},()=>{}),e},async _saveNow(t){let e=Ne(t);return await k.saveJumpDests(e)!==!1?(Rt=e,!0):(S("Failed to save jump destinations","error"),!1)},async save(t){return this._enqueue(()=>this._saveNow(t))},all(){return Rt},find(t,e){let o=String(e||"").toLowerCase();return Rt.find(n=>n.account===t&&n.profile.toLowerCase()===o)||null},async upsert(t,e,o={}){return this._enqueue(()=>{let n=this.find(t,e),a={...n||{account:t,profile:e},...o,account:t,profile:e},s=n?Rt.map(l=>l===n?a:l):[...Rt,a];return this._saveNow(s)})},async remove(t,e){return this._enqueue(()=>{let o=this.find(t,e);return o?this._saveNow(Rt.filter(n=>n!==o)):!0})}},ne={},jt={},Ot={async loadCache(){ne=await k.getAccountNames(),c("Account names cache loaded:",ne)},async save(t){return await k.saveAccountNames(t)!==!1?(ne={...t},!0):(S("Failed to save account names","error"),!1)},nameFor(t){return t&&ne[t]||""},all(){return ne}},Z={async loadCache(){jt=await k.getAccountTags(),c("Account tags cache loaded:",jt)},async save(t){let e=vo(t);return await k.saveAccountTags(e)!==!1?(jt=e,!0):(S("Failed to save account tags","error"),!1)},all(){return jt},tagsFor(t){return t&&jt[t]||[]},allTags(){let t=new Map;for(let e of Object.values(jt))for(let o of e){let n=o.toLowerCase();t.has(n)||t.set(n,o)}return[...t.values()].sort((e,o)=>e.localeCompare(o))},async setTags(t,e){if(!/^\d{12}$/.test(t||""))return!1;let o=Ie(e),n={...jt};return o.length?n[t]=o:delete n[t],this.save(n)},async addTag(t,e){return this.setTags(t,[...this.tagsFor(t),e])},async removeTag(t,e){let o=String(e||"").toLowerCase();return this.setTags(t,this.tagsFor(t).filter(n=>n.toLowerCase()!==o))}},Bn='<svg class="tm_tag_ico" viewBox="0 0 16 16" width="11" height="11" aria-hidden="true"><path d="M2 2h5.2a1 1 0 0 1 .7.3l6 6a1 1 0 0 1 0 1.4l-4 4a1 1 0 0 1-1.4 0l-6-6A1 1 0 0 1 2 7.2V2z" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="5.2" cy="5.2" r="1.1" fill="currentColor"/></svg>',jo=t=>{let e=Z.tagsFor(t).length;return e?`${Bn}<span class="tm_tag_n">${e}</span>`:'<span class="tm_tag_plus">+</span>tag'},Do=t=>{if(!/^\d{12}$/.test(t||""))return"";let e=Z.tagsFor(t).length,o=e?"tm_tag_chip":"tm_tag_chip tm_no_tags",n=e?`${e} tag${e===1?"":"s"} \u2014 click to edit`:"Add a tag";return`<button type="button" class="${o}" data-account-id="${v(t)}" aria-expanded="false" title="${n}">${jo(t)}</button>`},Mo=t=>Z.tagsFor(t).map(e=>{let o=v(e);return`<span class="tm_tag_pill">${o}<button type="button" class="tm_tag_del" data-account-id="${v(t)}" data-tag="${o}" aria-label="Remove ${o}">\u2715</button></span>`}).join(""),Go=t=>/^\d{12}$/.test(t||"")?`<div class="tm_tag_pills">${Mo(t)}</div><div class="tm_tag_addwrap"><button type="button" class="tm_tag_add" data-account-id="${v(t)}"><span class="tm_tag_plus">+</span> tag</button></div>`:"",Po=t=>{let e=t.getAttribute("data-account-id");t.classList.toggle("tm_no_tags",Z.tagsFor(e).length===0),t.innerHTML=jo(e)},zo=t=>{let e=t.closest(".tm_tag_editor");e&&(t.innerHTML=Mo(e.getAttribute("data-account-id")))},Me=t=>{/^\d{12}$/.test(t||"")&&(document.querySelectorAll(`.tm_tag_chip[data-account-id="${t}"]`).forEach(Po),document.querySelectorAll(`.tm_tag_editor[data-account-id="${t}"] .tm_tag_pills`).forEach(zo),Ge(),K.applyFilters(!0))},Ge=()=>{Ct("tag",Z.allTags().map(t=>({id:t,label:t}))),document.querySelectorAll('.tm_filter_button[data-group="tag"]').forEach(t=>{(C.tag||[]).includes(t.getAttribute("data-filter"))&&t.classList.add("active")})},Uo=()=>{let t=document.getElementById("tm_tag_vocab");t||(t=document.createElement("datalist"),t.id="tm_tag_vocab",document.body.appendChild(t)),t.innerHTML=Z.allTags().map(e=>`<option value="${v(e)}"></option>`).join("")},Yn=t=>{let e=document.createElement("input");return e.type="text",e.className="tm_tag_input",e.setAttribute("list","tm_tag_vocab"),e.setAttribute("data-account-id",t),e.setAttribute("placeholder","tag\u2026"),e.setAttribute("aria-label","Add a tag"),e},Fo=t=>{let e=document.createElement("button");return e.type="button",e.className="tm_tag_add",e.setAttribute("data-account-id",t),e.innerHTML='<span class="tm_tag_plus">+</span> tag',e},Ho=t=>{Uo();let e=Yn(t.getAttribute("data-account-id"));return t.replaceWith(e),e.focus(),e},ve=({cacheGet:t,cacheSet:e,storageGet:o,storageSave:n,label:a})=>({async loadCache(){e(await o()),c(`${a} cache loaded:`,t())},async save(s){return await n(s)!==!1?(e(s),!0):(S(`Failed to save ${a}`,"error"),!1)},entries(){return t()},findEntry(s){return t().find(l=>l.id===s)||null},matches(s,l,m){let h=this.findEntry(s);return h?fo(h.patterns,l,m):!1}}),F={...ve({cacheGet:()=>ce,cacheSet:t=>{ce=t},storageGet:()=>k.getEnvPatterns(),storageSave:t=>k.saveEnvPatterns(t),label:"environments"}),classify(t,e){let o=(t||"").toLowerCase(),n=(e||"").toString().trim(),a=ce||[];if(n)for(let s of a)for(let l of s.patterns||[]){let m=(l||"").toString().trim();if(m&&m===n)return s.id}for(let s of a)for(let l of s.patterns||[]){let m=(l||"").toString().trim().toLowerCase();if(m&&o.includes(m))return s.id}return"default"},colorFor(t){let e=(ce||[]).find(o=>o.id===t);return e?e.color:"#6c757d"},letterFor(t){let e=(ce||[]).find(n=>n.id===t),o=e&&e.label?e.label:"";return o?o.charAt(0).toUpperCase():"?"}},Pe=t=>{let e=t.find(".tm_account_name").text(),o=t.find(".tm_account_id").text();return F.classify(e,o)},pt={...ve({cacheGet:()=>je,cacheSet:t=>{je=t},storageGet:()=>k.getOrgPatterns(),storageSave:t=>k.saveOrgPatterns(t),label:"organizations"}),classify(t,e){for(let o of je||[])if(fo(o.patterns,t,e))return o.id;return""}},ot=ve({cacheGet:()=>Ro,cacheSet:t=>{Ro=t},storageGet:()=>k.getTypePatterns(),storageSave:t=>k.saveTypePatterns(t),label:"account types"}),Kt={...ve({cacheGet:()=>Oo,cacheSet:t=>{Oo=t},storageGet:()=>k.getRolePatterns(),storageSave:t=>k.saveRolePatterns(t),label:"role names"}),matches(t,e){let o=this.findEntry(t);return o?kn(o.patterns,e):!1}},X={async loadCache(){It=await k.getAwsRegion(),Nt=await k.getRememberRegion(),qt=await k.getRegionLock(),Gt=await k.getHomepageUrl(),Xt=await k.getSigninConfirmRoleKeywords(),Et=await k.getSigninConfirmTypeIds(),c("General settings cache loaded:",{region:It,rememberRegion:Nt,regionLock:qt,homepage:Gt,signinRoleKeywords:Xt,signinTypeIds:Et})},region(){return It},rememberRegion(){return Nt},regionLock(){return qt},homepage(){return Gt},signinRoleKeywords(){return Xt},signinTypeIds(){return Et},async save({region:t,rememberRegion:e,regionLock:o,homepage:n,signinRoleKeywords:a,signinTypeIds:s}){It=(t||"").trim()||r.DEFAULT_AWS_REGION,Nt=!!e,qt=!!o;let m=(n||"").trim();return Gt=!m||no(m)?m:"",Xt=Array.isArray(a)?a.map(h=>(h||"").trim()).filter(Boolean):[],Et=Array.isArray(s)?s.map(h=>(h||"").trim()).filter(Boolean):[],await Promise.all([k.saveAwsRegion(It),k.saveRememberRegion(Nt),k.saveRegionLock(qt),k.saveHomepageUrl(Gt),k.saveSigninConfirmRoleKeywords(Xt),k.saveSigninConfirmTypeIds(Et)]),!0}},$t={async loadCache(){mt=await k.getRecentRoles(),pe=await k.getRecentLimit(),c("Recent roles cache loaded:",mt,"limit:",pe)},async recordSignIn(t){if(!t)return;let e=Date.now();mt=[{roleArn:t,ts:e},...mt.filter(n=>n.roleArn!==t)].slice(0,Math.max(0,pe)),await k.saveRecentRoles(mt)},async setLimit(t){let e=parseInt(t,10);return!Number.isFinite(e)||e<1||e>100?(S("Please enter a number between 1 and 100","error"),!1):(pe=e,mt.length>e&&(mt=mt.slice(0,e),await k.saveRecentRoles(mt)),await k.saveRecentLimit(e),!0)},isRecent(t){return t?mt.some(e=>e.roleArn===t):!1},getLimit(){return pe}},Bt={LIST_ID:"tm_role_list",async loadCache(){Pt=await k.getRoleOrder(),c("Role order cache loaded:",Pt.length,"entries")},ensureList(){let t=i("#"+this.LIST_ID);if(t.length===0){t=i(`<div id="${this.LIST_ID}"></div>`);let e=i("#saml_form"),o=e.find("#tm_interface_wrapper");o.length?o.after(t):e.append(t)}return i(".saml-role").each(function(){this.parentNode!==t[0]&&t[0].appendChild(this)}),t},applySavedOrder(){let t=i("#"+this.LIST_ID);if(!t.length||!Pt||Pt.length===0)return;let e=Object.create(null);Pt.forEach((a,s)=>{e[a]=s});let o=Number.MAX_SAFE_INTEGER;t.find(".saml-role").get().map((a,s)=>{let l=i(a).find(".tm_signin_button").data("role-arn")||"";return{el:a,originalIdx:s,sortKey:e[l]!==void 0?e[l]:o}}).sort((a,s)=>a.sortKey-s.sortKey||a.originalIdx-s.originalIdx).forEach(({el:a})=>t[0].appendChild(a))},async saveCurrentOrder(){let t=[];i("#"+this.LIST_ID+" .saml-role").each(function(){let e=i(this).find(".tm_signin_button").data("role-arn");e&&t.push(e)}),Pt=t,await k.saveRoleOrder(t)}},re=t=>{let e=t?[t]:U;for(let n of e){let a=i(`.tm_button_group[data-filter-group="${n}"]`);if(!a.length)continue;let s=a.closest(".tm_frow");if(!s.length)continue;if(n==="source"){!!document.querySelector('#tm_role_list .saml-role[data-jump="1"]')?s.removeClass("tm_frow_hidden"):(s.addClass("tm_frow_hidden"),C.source&&C.source.length&&(C.source=[],a.find(".tm_filter_button").removeClass("active")));continue}let l=n==="tag"?1:2;a.find(".tm_filter_button").length>=l?s.removeClass("tm_frow_hidden"):(s.addClass("tm_frow_hidden"),C[n]&&C[n].length&&(C[n]=[],a.find(".tm_filter_button").removeClass("active")))}let o=U.some(n=>{let a=document.querySelector(`.tm_button_group[data-filter-group="${n}"]`),s=a&&a.closest(".tm_frow");return s&&!s.classList.contains("tm_frow_hidden")});i(".tm_frow_shortcuts").toggleClass("tm_frow_bare",!o)},Ct=(t,e)=>{let o=i(`.tm_button_group[data-filter-group="${t}"]`);if(!o.length)return;o.find(".tm_filter_button").remove();let n=(e||[]).map(a=>{let s=v(a.label||a.id),l=v(a.id),m=a.color&&/^#[0-9a-fA-F]{3,8}$/.test(a.color)?a.color:"#adb5bd";return i(`<a href="#" class="tm_filter_button" data-group="${t}" data-filter="${l}" data-color="1" style="--tm-fb-color: ${m};">${s}</a>`)});if(n.length){let a=o.children().not(".tm_filter_button").first();a.length?a.before(n):o.append(n)}I(),re(t)},Jn=()=>{Ct("org",pt.entries()),Ct("env",F.entries()),Ct("type",ot.entries()),Ct("role",Kt.entries()),Ge()},de=()=>{i(".saml-role").each(function(){let t=i(this),e=Pe(t),o=t.attr("data-jump")==="1";if(e==="default"){t.removeAttr("data-env-id"),o?(this.style.setProperty("border-left-color","#c7ccd1","important"),this.style.setProperty("border-left-width","4px","important"),this.style.setProperty("border-left-style","dashed","important")):(this.style.removeProperty("border-left-color"),this.style.removeProperty("border-left-width"),this.style.removeProperty("border-left-style"));return}let n=F.colorFor(e);t.attr("data-env-id",e),this.style.setProperty("border-left-color",n,"important"),this.style.setProperty("border-left-width","4px","important"),this.style.setProperty("border-left-style",o?"dashed":"solid","important")})},ze=new Set(["tag","tags","role","name","account","acct","id","env","environment","type","org","organization","organisation","is","source"]),Ue={raw:null,terms:[],used:new Set},Wn=()=>{if(Ue.raw!==H){let t=H?So(H,ze):[];Ue={raw:H,terms:t,used:new Set(t.map(e=>e.field).filter(Boolean))}}return Ue},Fe=new Map,Vn=t=>{if(!Fe.has(t)){let e=So(t,ze);Fe.set(t,{terms:e,used:new Set(e.map(o=>o.field).filter(Boolean))})}return Fe.get(t)},qn=t=>{let e=t.find(".tm_account_name").text().toLowerCase(),o=t.find(".tm_account_id").text().toLowerCase(),n=t.find(".tm_role_name").text().toLowerCase(),a=Z.tagsFor(o).join(" ").toLowerCase(),s=`${e} ${o} ${n} ${a}`,l=t.find(".tm_signin_button").data("role-arn"),m=t.attr("data-jump")==="1";if(Y&&(m||!Y.arns.has(l)))return!1;let h=Wn(),T=h.terms,w=!!a&&T.some(y=>!y.negate&&(y.field===""||y.field==="tag"||y.field==="tags")&&y.values.some(d=>d.quoted?a.includes(d.text.toLowerCase()):wo(d.text,a)));t.find(".tm_tag_chip").toggleClass("tm_tag_matched",w);let R=`${e} ${o}`,x=y=>{let d={_all:s,tag:a,tags:a,role:n,name:e,id:o,account:R,acct:R,is:m?"jump jumps chained":"direct signin sign-in",source:m?"jump jumps chained":"direct signin sign-in"};if(y.has("env")||y.has("environment")){let g=F.classify(e,o),O=F.entries().find(N=>N.id===g);d.env=d.environment=`${g||""} ${O?O.label:""}`.toLowerCase()}return y.has("type")&&(d.type=ot.entries().filter(g=>ot.matches(g.id,e,o)).map(g=>`${g.id} ${g.label}`).join(" ").toLowerCase()),(y.has("org")||y.has("organization")||y.has("organisation"))&&(d.org=d.organization=d.organisation=pt.entries().filter(g=>pt.matches(g.id,e,o)).map(g=>`${g.id} ${g.label}`).join(" ").toLowerCase()),d};if(T.length&&!To(T,x(h.used)))return!1;if(C.org.length>0){let y=t.find(".tm_account_id").text(),d=t.find(".tm_account_name").text();if(!C.org.some(O=>pt.matches(O,d,y)))return!1}if(C.env.length>0){let y=t.find(".tm_account_id").text(),d=F.classify(e,y);if(!C.env.includes(d))return!1}if(C.type.length>0){let y=t.find(".tm_account_id").text(),d=t.find(".tm_account_name").text();if(!C.type.some(O=>ot.matches(O,d,y)))return!1}if(C.role.length>0&&!C.role.some(d=>Kt.matches(d,n))||C.source.length>0&&!C.source.includes(m?"jump":"direct"))return!1;if(C.tag.length>0){let y=Z.tagsFor(o);if(!C.tag.some(d=>y.includes(d)))return!1}if(C.show.length>0)for(let y of C.show)if(y==="favorites"){if(!Zt.isFavoriteSync(l))return!1}else if(y==="recent"){if(!$t.isRecent(l))return!1}else if(y.startsWith("custom_")){let d=A(r.SELECTORS.CUSTOM_SHORTCUTS).filter(`[data-filter="${y}"]`);if(d.length>0){let g=Vn(String(d.data("search")||""));if(g.terms.length&&!To(g.terms,x(g.used)))return!1}else return!1}else return!1;return!0},K={debouncedApplyFilters:_(()=>{K.applyFilters()},r.SEARCH_DEBOUNCE_DELAY),applyFilters(t=!1){let e=0,o=0;c("Applying filters:",C,"Search:",H),A(r.SELECTORS.SAML_ROLES).each(function(){let l=i(this);o++,qn(l)?(l.css("display","").show(),e++):l.css("display","none").hide()}),c(`Visible: ${e}, Total: ${o}`),Ao=e,de();let n=Object.values(C).flat().length,a=H.length>0,s=n>0||a||!!Y;document.body.classList.toggle("tm_filters_active",s),ct.refreshActive(),s&&!t&&S(`Showing ${e} of ${o} roles`,"info",r.TOAST_DURATION_LONG)},clearAll(){Y&&(Y=null,Ve(null),qe(null),tt.render()),C=G(),H="",A(r.SELECTORS.FILTER_BUTTONS).removeClass("active"),A(r.SELECTORS.SEARCH_INPUT).val(""),A(r.SELECTORS.SAML_ROLES).each(function(){i(this).css("display","").show()}),document.body.classList.remove("tm_filters_active"),de(),S("All filters cleared","info",r.TOAST_DURATION_SHORT)}},bt=null,yt={capture(){return{filters:P(C),search:H}},hasCurrent(){return Object.values(C).flat().length>0||H.length>0},apply(t,e){return!t||!t.filters?!1:(C=P(t.filters,!0),H=typeof t.search=="string"?t.search:"",i(".tm_filter_button").removeClass("active"),Object.keys(C).forEach(o=>{C[o].forEach(n=>{i(`.tm_filter_button[data-group="${o}"][data-filter="${n}"]`).addClass("active")})}),A(r.SELECTORS.SEARCH_INPUT).val(H),re(),K.applyFilters(!!e),!0)}},He=()=>{i("#tm_start_view").text(`Start View: ${bt?"On":"Off"}`)},Xn=()=>{i("#tm_start_view_modal").remove();let t=!!bt,e=yt.hasCurrent(),o=kt.length,n=d=>({search:typeof d.search=="string"?d.search:"",filters:P(d.filters)}),a=d=>({search:"",filters:{...G(),show:[d]}}),s=d=>({search:"",filters:{...G(),tag:[d]}}),l=[{group:"Views",label:`\u2605 Favorites${o?` (${o})`:""}`,view:a("favorites"),disabled:!o,title:o?"Open showing only starred roles":"Star some roles first \u2014 the \u2606 on each row",msg:"Start view set to your Favorites."},{group:"Views",label:"\u21BB Recent",view:a("recent"),title:"Open showing recently used roles",msg:"Start view set to Recent."},...at.map(d=>({group:"Shortcuts",label:v(d.label),view:n(d),title:"Open with this shortcut's search and filters",msg:`Start view set to "${d.label}".`})),...Z.allTags().map(d=>({group:"Tags",label:v(d),view:s(d),title:"Open filtered to this tag",msg:`Start view set to tag "${d}".`}))],m=d=>t&&rt(bt,d),h=(d,g)=>{let O=m(d.view);return`<button type="button" class="tm_sv_pick${O?" tm_sv_active":""}"${d.disabled?" disabled":""} title="${v(d.title)}" data-sv-idx="${g}">${d.label}${O?" \u2713":""}</button>`},T=["Views","Shortcuts","Tags"].map(d=>{let g=l.map((O,N)=>O.group===d?h(O,N):"").join("");return g?`<span class="tm_sv_rowlabel">${d}</span><div class="tm_sv_chips">${g}</div>`:""}).join(""),x=`
            <div id="tm_start_view_modal" style="
                position: fixed !important; top: 0 !important; left: 0 !important;
                right: 0 !important; bottom: 0 !important;
                background: rgba(0,0,0,0.5) !important; z-index: 10001 !important;
                display: flex !important; align-items: center !important; justify-content: center !important;
            ">
                <div style="
                    background: white !important; border-radius: 8px !important; padding: 22px 24px !important;
                    max-width: 470px !important; width: 90% !important; max-height: 80vh !important; overflow-y: auto !important;
                ">
                    <h3 style="margin: 0 0 10px 0 !important; color: #16191f !important;">Start View</h3>
                    <p style="margin: 0 0 16px 0 !important; color: #6c757d !important; font-size: 14px !important; line-height: 1.5 !important;">
                        Choose the view the role picker opens with \u2014 it's re-applied automatically every time this page loads.
                    </p>
                    ${t&&!l.some(d=>rt(bt,d.view))?'<div style="margin: 0 0 16px 0 !important; padding: 8px 10px !important; background: #e7f2fb !important; border-radius: 5px !important; color: #0073bb !important; font-size: 12.5px !important; line-height: 1.4 !important;">A custom start view (your saved filters) is active. Pick one below to replace it, or Clear.</div>':""}
                    <div class="tm_sv_grid">${T}</div>
                    <div class="tm_sv_footer">
                        <div class="tm_sv_footer_left">
                            <button id="tm_start_view_save" type="button" class="tm_sv_btn" ${e?"":"disabled"} title="Save whatever filters and search you have active right now">Save current filters</button>
                            <button id="tm_start_view_clear" type="button" class="tm_sv_btn" ${t?"":"disabled"} title="Remove the start view (favorites untouched)">Clear</button>
                        </div>
                        <button id="tm_start_view_cancel" type="button" class="tm_sv_btn">Close</button>
                    </div>
                </div>
            </div>
        `;i("body").append(x);let y=async(d,g)=>{await k.saveStartView(d)!==!1&&(bt=d,He(),yt.apply(d,!0),i("#tm_start_view_modal").remove(),S(g,"success",r.TOAST_DURATION))};i("#tm_start_view_cancel, #tm_start_view_modal").on("click",function(d){d.target===this&&i("#tm_start_view_modal").remove()}),i("#tm_start_view_modal").on("click",".tm_sv_pick",async function(){if(this.disabled)return;let d=l[Number(this.getAttribute("data-sv-idx"))];d&&await y(d.view,d.msg)}),i("#tm_start_view_save").on("click",async function(){yt.hasCurrent()&&await y(yt.capture(),"Start view saved \u2014 the picker will open with these filters.")}),i("#tm_start_view_clear").on("click",async function(){bt&&(await k.clearStartView(),bt=null,He(),i("#tm_start_view_modal").remove(),S("Start view cleared (your favorites are untouched).","info",r.TOAST_DURATION))})},Ke="hop_signin_tokens",Qn=300*1e3,Ko=async(t,e,o,n,a,s=1)=>{/^\d{12}$/.test(String(t||""))&&await u(async()=>{let l=(await chrome.storage.local.get("hop_pending_jumps")).hop_pending_jumps||{},m=Date.now();for(let h of Object.keys(l))(!l[h]||!l[h].ts||m-l[h].ts>300*1e3)&&delete l[h];l[t]={label:e,envColor:o,envLetter:n,region:a||"",ts:m},s>1&&(l[t].remaining=s),await chrome.storage.local.set({hop_pending_jumps:l})})},Be=async()=>{let t=new Uint8Array(16);crypto.getRandomValues(t);let e=Array.from(t,o=>o.toString(16).padStart(2,"0")).join("");return await u(async()=>{let o=(await chrome.storage.local.get(Ke))[Ke]||{},n=Date.now();for(let a of Object.keys(o))(!o[a]||n-o[a]>Qn)&&delete o[a];o[e]=n,await chrome.storage.local.set({[Ke]:o})}),e},Ye=(t,e,o)=>{let n=o||X.region()||r.DEFAULT_AWS_REGION,a=ht(n)?n:r.DEFAULT_AWS_REGION,s=`https://${a}.console.aws.amazon.com`,l=(t||"").replace(/\{region\}/g,a),m=l?`${s}/${l}`:`${s}/`;if(!e)return m;try{let h=new TextEncoder().encode(JSON.stringify(e)),T="";for(let x of h)T+=String.fromCharCode(x);let w=btoa(T),R=m.includes("#")?"&":"#";return`${m}${R}hop=${w}`}catch(h){return console.warn("Failed to encode tab label payload:",h),m}},Bo=(t,e,{newTab:o=!1}={})=>{let n=i('input[type="radio"][name="roleIndex"]').filter(function(){return this.value===t});if(n.length===0){console.error("Could not find radio button for role:",t),S("Error: Could not find role to select","error");return}i('input[type="radio"][name="roleIndex"]').prop("checked",!1),n.prop("checked",!0);let a=i("#saml_form");if(a.length===0){console.error("Could not find SAML form"),S("Error: Could not find form to submit","error");return}let s=a.find('input[name="RelayState"]');s.length===0&&(s=i('<input type="hidden" name="RelayState">').appendTo(a)),s.val(e);let l=i("#signin_button");if(l.length>0){let h=l.attr("name")||"signin",T=l.val()||"Sign In",w=a.find(`input[type="hidden"][name="${h}"]`).first();w.length||(w=i('<input type="hidden">').attr("name",h).appendTo(a)),w.val(T)}let m=a.attr("target");o&&a.attr("target",`_blank_hop_${Date.now()}`),a.submit(),o&&setTimeout(()=>{m?a.attr("target",m):a.removeAttr("target")},0)},Yo=({accountName:t,accountId:e,roleName:o,env:n,tag:a=it})=>{let s={account:t,role:o,env:n,envColor:n!=="default"?F.colorFor(n):"",envLetter:n!=="default"?F.letterFor(n):""};if(a&&(s.tag=a),s.groupMode=st,st==="org"){let l=pt.classify(t,e);if(l){let m=pt.findEntry(l);s.org=m&&m.label?m.label:l}}return s},vt=t=>{let e=[...document.querySelectorAll('input[type="radio"][name="roleIndex"]')].find(n=>n.value===t);if(!e)return null;let o=i(e).closest(".saml-role");return!o.length||o.attr("data-jump")==="1"?null:{$role:o,roleArn:t,roleName:o.find(".tm_role_name").text().trim(),accountName:o.find(".tm_account_name").text().trim(),accountId:o.find(".tm_account_id").text().trim(),env:Pe(o)}},Zn=(t,e,o)=>{let n=[];t.querySelectorAll('input[type="hidden"]').forEach(s=>{!s.name||s.name==="RelayState"||s.name==="roleIndex"||n.push([s.name,s.value])}),n.push(["RelayState",o]),n.push(["roleIndex",e]);let a=document.getElementById("signin_button");if(a){let s=a.getAttribute("name")||"signin";n.some(([l])=>l===s)||n.push([s,a.value||"Sign In"])}return n},tr=async(t,{tag:e=""}={})=>{let o=document.getElementById("saml_form");if(!o)throw new Error("the role picker's sign-in form is missing");let n=new Map,a=[];for(let l of t){let m=vt(l.roleArn);if(!m)throw new Error(`${l.roleArn} is not in today's role list`);let h=Yo({...m,tag:e||it});h.tok=await Be();let T=Ye(l.service||"",h,l.region||"");a.push({fields:Zn(o,l.roleArn,T)});let w=n.get(m.accountId)||{info:m,tabs:0};w.tabs++,n.set(m.accountId,w)}for(let[l,{info:m,tabs:h}]of n){let T=m.env;await Ko(l,m.accountName,T!=="default"?F.colorFor(T):"",T!=="default"?F.letterFor(T):"","",h)}for(let l of t)await $t.recordSignIn(l.roleArn);let s=await new Promise(l=>{try{chrome.runtime.sendMessage({type:"hop_launch",action:o.action,tabs:a},m=>l(chrome.runtime.lastError?null:m))}catch{l(null)}});if(!s||!s.ok)throw new Error(s&&s.error||"the extension's background worker didn't answer");return s.opened},Dt=[],Y=null,Je=5,xe=!1,Jo=()=>{let t=new Uint8Array(6);return crypto.getRandomValues(t),Array.from(t,e=>e.toString(36).padStart(2,"0")).join("").slice(0,12)},lt=(t,e,o=`${e}s`)=>`${t} ${t===1?e:o}`,ue=t=>{if(!t)return"Console home";let e=V.getServicesSync().find(n=>n&&n.path===t);if(e)return e.name;let o=t.split(/[/?#]/)[0]||t;return o.length<=4?o.toUpperCase():o.charAt(0).toUpperCase()+o.slice(1)},Wo=t=>!t||V.getServicesSync().some(e=>e&&e.path===t),er=t=>{let e=V.serviceOptionsHTML(t);return Wo(t)?e:`<option value="${v(t)}" selected>${v(ue(t))} \xB7 saved page</option>${e}`},We=t=>{let e=vt(t);if(e)return{account:e.accountName,accountId:e.accountId,role:e.roleName,info:e};let o=String(t).match(/^arn:aws[a-z-]*:iam::(\d{12}):role\/(?:.*\/)?([^/]+)$/);return{account:o?o[1]:t,accountId:o?o[1]:"",role:o?o[2]:"",info:null}},tt={async loadCache(){Dt=await k.getLaunchSets()},find(t){return Dt.find(e=>e.id===t)||null},findByName(t,e){let o=String(t||"").trim().toLowerCase();return Dt.find(n=>n.id!==e&&n.name.toLowerCase()===o)||null},ordered(){return[...Dt].sort((t,e)=>(e.lastUsed||0)-(t.lastUsed||0)||t.name.localeCompare(e.name))},async saveAll(t){let e=he(t);return await k.saveLaunchSets(e)===!1?(S("Couldn't save your sets.","error",r.TOAST_DURATION_LONG),!1):(Dt=e,Y&&!this.find(Y.id)?Xe():Y&&we(Y.id,{keepFilters:!0}),this.render(),!0)},async upsert(t){let e=Dt.findIndex(n=>n.id===t.id),o=Dt.slice();return e>=0?o[e]=t:o.push(t),this.saveAll(o)},async remove(t){return this.saveAll(Dt.filter(e=>e.id!==t))},async touch(t){let e=this.find(t);e&&await this.upsert({...e,lastUsed:Date.now()})},render(){let t=i("#tm_sets_list");if(!t.length)return;let e=this.ordered();if(!e.length){t.html('<div class="tm_sets_empty">Save the console tabs a ticket needs, then open them all in one click.</div>');return}let n=(xe?e:e.slice(0,Je)).map(s=>{let l=Y&&Y.id===s.id,m=v(s.id),h=s.tabs.length;return`
          <div class="tm_set_line">
            <a href="#" class="tm_set_chip${l?" active":""}" data-set-id="${m}" title="Show this set's roles in the listing">
              <span class="tm_set_name">${v(s.name)}</span>
              <span class="tm_set_count">${lt(h,"tab")}</span>
            </a>
            <button type="button" class="tm_set_open" data-set-id="${m}" title="Open all ${lt(h,"tab")}">Open \u2197</button>
          </div>`}).join(""),a=e.length>Je?`<a href="#" id="tm_sets_more">${xe?"Fewer":`More (${e.length-Je})`}</a>`:"";t.html(n+a)}},or=t=>"opens "+t.map(e=>ue(e.service)).join(" + "),Ve=t=>{if(document.querySelectorAll(".tm_role_name[data-set-hint]").forEach(o=>o.removeAttribute("data-set-hint")),!t)return;let e=new Map;t.tabs.forEach(o=>{e.has(o.roleArn)||e.set(o.roleArn,[]),e.get(o.roleArn).push(o)});for(let[o,n]of e){let a=vt(o),s=a&&a.$role.find(".tm_role_name")[0];s&&s.setAttribute("data-set-hint",or(n))}},qe=t=>{if(i("#tm_set_bar").remove(),!t)return;let e=t.tabs.filter(l=>vt(l.roleArn)),o=t.tabs.length-e.length,n=Mn(t),a=[`${lt(t.tabs.length,"tab")} across ${lt(n,"role")}`,t.group?`tab group \u201C${v(t.group)}\u201D`:"no tab group"];o&&a.push(`<span class="tm_set_bar_warn">${o} not in today's role list</span>`);let s=`
      <div id="tm_set_bar">
        <strong>Set: ${v(t.name)}</strong>
        <span class="tm_set_bar_sub">${a.join(" \xB7 ")}</span>
        <span class="tm_set_bar_spacer"></span>
        <a href="#" id="tm_set_bar_edit">Edit</a>
        <a href="#" id="tm_set_bar_close">Show all roles</a>
        <button type="button" class="tm_set_open tm_set_open_primary" data-set-id="${v(t.id)}"${e.length?"":" disabled"}>Open all (${e.length}) \u2197</button>
      </div>`;i("#tm_role_list").before(s)},we=(t,{keepFilters:e=!1}={})=>{let o=tt.find(t);o&&(e||(C=G(),H="",i(".tm_filter_button").removeClass("active"),A(r.SELECTORS.SEARCH_INPUT).val("")),Y={id:t,arns:new Set(o.tabs.map(n=>n.roleArn))},Ve(o),qe(o),tt.render(),K.applyFilters(!0))},Xe=()=>{Y&&(Y=null,Ve(null),qe(null),tt.render(),K.applyFilters(!0))},nr=t=>{let e=a=>String(a).split("/").pop(),o=new Set(wt.map(a=>`${a.account}/${a.role}`)),n=t.filter(a=>!o.has(`${a.accountId}/${e(a.roleArn)}`)).length;return{known:rn,inUse:wt.length,needed:n,limit:Mt||5}},rr=(t,e,o,n,a)=>new Promise(s=>{let l=a.known&&a.inUse+a.needed>a.limit,m=n.length>0,h=m?"#dc3545":"#d69e2e",T=new Map;e.forEach(b=>{T.has(b.roleArn)||T.set(b.roleArn,[]),T.get(b.roleArn).push(b)});let w=new Map(n.map(b=>[b.info.roleArn,b.reasons])),R=(b,D,J,et)=>`
        <div style="display: flex !important; align-items: center !important; gap: 10px !important; padding: 5px 0 !important; border-bottom: 1px solid #eef0f2 !important;${et?" color: #adb5bd !important;":""}">
          <span style="flex: 1 !important; min-width: 0 !important;">${b}</span>
          <span style="color: ${et?"#adb5bd":"#6c757d"} !important; font-size: 12.5px !important; text-align: right !important;">${D}</span>
          ${J||""}
        </div>`,x=(b,D,J)=>`<span style="background: ${D} !important; color: ${J} !important; font-size: 11px !important; font-weight: 700 !important; border-radius: 3px !important; padding: 1px 6px !important; white-space: nowrap !important;">${v(b)}</span>`,y=[...T].map(([b,D])=>{let J=We(b),et=w.get(b),_o=`${et?"<strong>":""}${v(J.account)} \xB7 ${v(J.role)}${et?"</strong>":""}`,go=D.map(se=>v(ue(se.service))).join(", ")+(D.length>1?` (${D.length} tabs)`:"");return R(_o,go,et?x(et.join(" \xB7 "),"#fdecee","#b02a37"):"")}).join(""),g=[...new Set(o.map(b=>b.roleArn))].map(b=>{let D=We(b);return R(`${v(D.account)} \xB7 ${v(D.role)}`,"",x("Not in today's role list \u2014 skipped","#f1f3f5","#6c757d"),!0)}).join(""),O=m?`<div style="background: #dc3545 !important; color: #fff !important; padding: 12px 20px !important; border-radius: 6px !important; font-size: 18px !important; font-weight: 700 !important; text-align: center !important; margin-bottom: 14px !important; box-shadow: 0 2px 6px rgba(220,53,69,0.25) !important;">Includes ${lt(n.length,"sensitive role")}</div>`:"",N=l?`<div style="border: 1px solid #f0c64b !important; background: #fff8e1 !important; border-radius: 4px !important; padding: 9px 12px !important; margin: 0 0 18px 0 !important; font-size: 13px !important; color: #16191f !important;">
             <strong>AWS sessions: ${a.inUse} in use + ${a.needed} new = ${a.inUse+a.needed} of ${a.limit}.</strong>
             AWS allows ${a.limit} console sessions at once, so some of these tabs won't sign in. Sign a session out first, or open anyway.
           </div>`:"",M=e.length,j=`
        <div id="tm_set_open_modal" style="
            position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
            background: rgba(0,0,0,0.55) !important; z-index: 10001 !important;
            display: flex !important; align-items: center !important; justify-content: center !important;
        ">
          <div style="
              background: white !important; border-radius: 8px !important; padding: 22px 24px !important;
              max-width: 560px !important; width: 90% !important; max-height: 84vh !important; overflow-y: auto !important;
              border-top: 6px solid ${h} !important; box-shadow: 0 8px 32px rgba(0,0,0,0.25) !important;
              font-size: 13.5px !important; color: #16191f !important;
          ">
            <div style="font-size: 12px !important; font-weight: 600 !important; letter-spacing: 1px !important; text-transform: uppercase !important; color: ${h} !important; margin-bottom: 8px !important;">Open set \xB7 ${v(t.name)}</div>
            ${O}
            <div style="background: #f8f9fa !important; border: 1px solid #e1e4e8 !important; border-radius: 4px !important; padding: 6px 12px !important; margin: 0 0 14px 0 !important;">
              ${y}${g}
            </div>
            ${N}
            <div style="text-align: right !important;">
              <button type="button" data-action="cancel" class="tm_sv_btn" style="margin-right: 8px !important;">Cancel</button>
              ${l?'<button type="button" data-action="sessions" class="tm_sv_btn" style="margin-right: 8px !important;">Manage sessions\u2026</button>':""}
              <button type="button" data-action="confirm" style="
                  padding: 7px 14px !important; border: 1px solid ${m?"#dc3545":"#0073bb"} !important;
                  background: ${m?"#dc3545":"#0073bb"} !important; color: white !important; border-radius: 4px !important;
                  cursor: pointer !important; font-weight: 600 !important; font-size: 13px !important;
              ">${l?"Open anyway":`Open ${lt(M,"tab")}`}</button>
            </div>
          </div>
        </div>`;i("body").append(j);let L=i("#tm_set_open_modal"),f=b=>{L.remove(),s(b)};L.on("click",function(b){b.target===this&&f(!1)}),L.find('[data-action="cancel"]').on("click",()=>f(!1)),L.find('[data-action="confirm"]').on("click",()=>f(!0)),L.find('[data-action="sessions"]').on("click",()=>{f(!1);let b=document.getElementById("tm_sessions_pill");b&&b.click()})}),Qe=!1,ar=async t=>{let e=tt.find(t);if(!e||Qe)return;let o=[],n=[];for(let h of e.tabs)(vt(h.roleArn)?o:n).push(h);if(!o.length){S(`None of ${e.name}'s roles are in today's role list.`,"error",r.TOAST_DURATION_LONG);return}let a=[...new Set(o.map(h=>h.roleArn))].map(vt),s=a.map(h=>({info:h,reasons:so(h.roleName,h.accountName,h.accountId)})).filter(h=>h.reasons.length),l=nr(a),m=l.known&&l.inUse+l.needed>l.limit;if(!((s.length||n.length||m)&&!await rr(e,o,n,s,l))){Qe=!0;try{let h=await tr(o,{tag:e.group});S(`Opening ${lt(h,"tab")} for ${e.name}\u2026`,"info",r.TOAST_DURATION_LONG),await tt.touch(t)}catch(h){S(`Couldn't open ${e.name}: ${h&&h.message?h.message:h}`,"error",r.TOAST_DURATION_LONG)}finally{Qe=!1}}},ir=()=>{let t=[];return i(".saml-role").each(function(){if(this.style.display==="none"||this.getAttribute("data-jump")==="1")return;let e=this.querySelector('input[type="radio"][name="roleIndex"]');if(!e||!Eo(e.value))return;let o=i(this);t.push({roleArn:e.value,service:String(o.find(".tm_service_dropdown").val()||""),region:String(o.find(".tm_region_dropdown").val()||""),account:o.find(".tm_account_name").text().trim(),role:o.find(".tm_role_name").text().trim()})}),t},sr=()=>H.trim()?H.trim().replace(/^tag:/i,"").slice(0,64):C.tag&&C.tag.length===1?String(C.tag[0]).slice(0,64):"",Ze=(t,e,o,n,a,s=640)=>`
    <div id="${t}" style="
        position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
        background: rgba(0,0,0,0.5) !important; z-index: 10001 !important;
        display: flex !important; align-items: center !important; justify-content: center !important;
    ">
      <div style="
          background: white !important; border-radius: 8px !important; padding: 20px !important;
          max-width: ${s}px !important; width: 94% !important; max-height: 84vh !important; overflow-y: auto !important;
          font-size: 13.5px !important; color: #16191f !important;
      ">
        <h3 style="margin: 0 0 12px 0 !important; color: #16191f !important;">${e}</h3>
        ${o?`<p style="margin: 0 0 14px 0 !important; color: #6c757d !important; font-size: 13.5px !important; line-height: 1.45 !important;">${o}</p>`:""}
        ${n}
        <div class="tm_set_modal_error" style="display: none; color: #b02a37 !important; font-size: 13px !important; margin-top: 10px !important;"></div>
        <div class="tm_set_modal_foot">${a}</div>
      </div>
    </div>`,to=(t,e)=>`
    <div class="tm_set_fields">
      <label>Set name<input type="text" class="tm_set_name_input" maxlength="64" value="${v(t)}" placeholder="e.g. OPS-1234" autocomplete="off"></label>
      <label>Tab group<input type="text" class="tm_set_group_input" maxlength="64" value="${v(e)}" placeholder="no tab group" autocomplete="off"></label>
    </div>`,eo=(t,e)=>{let o=e;t.find(".tm_set_group_input").on("input",()=>{o=!1}),t.find(".tm_set_name_input").on("input",function(){o&&t.find(".tm_set_group_input").val(this.value)})},xt=(t,e)=>{let o=t.find(".tm_set_modal_error")[0];o&&(o.textContent=e||"",o.style.setProperty("display",e?"block":"none","important"))},oo=(t,e)=>{let o=String(t.find(".tm_set_name_input").val()||"").trim(),n=String(t.find(".tm_set_group_input").val()||"").trim();return o?tt.findByName(o,e)?{error:`There's already a set called \u201C${o}\u201D. Pick another name, or edit that set.`}:{name:o,group:n}:{error:"Give the set a name."}},Vo=()=>{let t=ir();if(!t.length){S("Filter the listing to the roles you want in the set first.","info",r.TOAST_DURATION_LONG);return}i("#tm_set_save_modal").remove();let e=sr(),o=t.map((m,h)=>`
      <label class="tm_set_pick">
        <input type="checkbox" data-row="${h}"${h<B?" checked":""}>
        <span class="tm_set_pick_who">${v(m.account)} \xB7 ${v(m.role)}</span>
        <span class="tm_set_pick_where">${v(ue(m.service))}${m.region?` \xB7 ${v(m.region)}`:""}</span>
      </label>`).join(""),n=`
      ${to(e,e)}
      <div class="tm_set_list_head"><span class="tm_set_count_label"></span><a href="#" class="tm_set_toggle_all">Select none</a></div>
      <div class="tm_set_picklist">${o}</div>`;i("body").append(Ze("tm_set_save_modal","Save current view as a set","Every role the listing shows now, each opening on the service and region its row is set to. Untick the ones you don't need. You can add more tabs per role afterwards with <strong>Edit</strong>.",n,`
      <span></span>
      <span><button type="button" class="tm_sv_btn" data-action="cancel">Cancel</button>
      <button type="button" class="tm_sv_btn tm_set_primary" data-action="save">Save set</button></span>`));let s=i("#tm_set_save_modal");eo(s,!0);let l=()=>{let m=s.find(".tm_set_pick input:checked").length;s.find(".tm_set_count_label").text(`${lt(m,"tab")} selected${m>B?` \u2014 a set holds at most ${B}`:""}`),s.find(".tm_set_toggle_all").text(m?"Select none":"Select all")};l(),s.on("change",".tm_set_pick input",l),s.find(".tm_set_toggle_all").on("click",m=>{m.preventDefault();let h=s.find(".tm_set_pick input:checked").length>0;s.find(".tm_set_pick input").prop("checked",!h),l()}),s.on("click",function(m){m.target===this&&s.remove()}),s.find('[data-action="cancel"]').on("click",()=>s.remove()),s.find('[data-action="save"]').on("click",async()=>{let m=oo(s);if(m.error)return xt(s,m.error);let h=s.find(".tm_set_pick input:checked").get().map(w=>t[Number(w.getAttribute("data-row"))]);if(!h.length)return xt(s,"Tick at least one role.");if(h.length>B)return xt(s,`A set holds at most ${B} tabs; untick ${h.length-B}.`);let T={id:Jo(),name:m.name,group:m.group,tabs:h.map(w=>({roleArn:w.roleArn,service:w.service,region:w.region})),lastUsed:0};await tt.upsert(T)&&(s.remove(),S(`Saved ${T.name} (${lt(T.tabs.length,"tab")}).`,"success",r.TOAST_DURATION),we(T.id))}),s.find(".tm_set_name_input").trigger("focus")},cr=t=>{let e=tt.find(t);if(!e)return;i("#tm_set_edit_modal").remove();let o=e.tabs.map(w=>({...w})),n=()=>{let w=[];return document.querySelectorAll('input[type="radio"][name="roleIndex"]').forEach(R=>{let x=vt(R.value);x&&w.push(x)}),w},a=()=>{let w=[];o.forEach(d=>{w.includes(d.roleArn)||w.push(d.roleArn)});let R=w.map(d=>{let g=We(d),O=g.info&&g.info.env!=="default"?F.colorFor(g.info.env):"#ced4da";return`${o.map((j,L)=>j.roleArn===d?L:-1).filter(j=>j>=0).map((j,L)=>{let f=o[j],b=L===0?`<div class="tm_set_who"><strong>${v(g.account)}</strong> \xB7 ${v(g.role)}
                 <small>${v(g.accountId)}${g.info?"":" \xB7 not in today's role list"}</small></div>`:'<div class="tm_set_who tm_set_same">\u21B3 same role, another tab</div>',D=Wo(f.service)?'<span class="tm_set_page_none">service home</span>':`<span title="${v(f.service)}">${v(f.service)}</span>`;return`
            <div class="tm_set_grid tm_set_row${L?" tm_set_row_extra":""}" data-tab="${j}">
              <span class="tm_set_stripe" style="background: ${v(O)} !important;"></span>
              ${b}
              <select class="tm_set_service" data-tab="${j}">${er(f.service)}</select>
              <select class="tm_set_region" data-tab="${j}"><option value=""${f.region?"":" selected"}>Default region</option>${Q.regionOptionsHTML(f.region)}</select>
              <span class="tm_set_page">${D}</span>
              <button type="button" class="tm_set_remove" data-tab="${j}" title="Remove this tab">\u2715</button>
            </div>`}).join("")}<div class="tm_set_grid tm_set_addrow"><span></span><a href="#" class="tm_set_addtab" data-role="${v(d)}">+ Add tab for this role</a></div>`}).join(""),x=new Set(o.map(d=>d.roleArn)),y=n().filter(d=>!x.has(d.roleArn)).map(d=>`<option value="${v(d.roleArn)}">${v(d.accountName)} \xB7 ${v(d.roleName)}</option>`).join("");return`
        <div class="tm_set_grid tm_set_ghead"><span></span><span>Account \xB7 role</span><span>Land on service</span><span>Land in region</span><span>Page</span><span></span></div>
        ${R||'<div class="tm_set_empty_grid">No tabs left. Add a role below, or Delete the set.</div>'}
        <div class="tm_set_addrole">
          <select class="tm_set_addrole_select"><option value="">+ Add a role\u2026</option>${y}</select>
          <span class="tm_set_tabcount">${lt(o.length,"tab")} (max ${B})</span>
        </div>`},s=`${to(e.name,e.group)}<div class="tm_set_editgrid">${a()}</div>`;i("body").append(Ze("tm_set_edit_modal",`Edit set \xB7 ${v(e.name)}`,"",s,`
      <button type="button" class="tm_sv_btn tm_set_delete" data-action="delete">Delete set</button>
      <span><button type="button" class="tm_sv_btn" data-action="cancel">Cancel</button>
      <button type="button" class="tm_sv_btn tm_set_primary" data-action="save">Save set</button></span>`,920));let m=i("#tm_set_edit_modal");eo(m,e.group===e.name);let h=()=>m.find(".tm_set_editgrid").html(a());m.on("change",".tm_set_service",function(){o[Number(this.getAttribute("data-tab"))].service=String(this.value||""),h()}),m.on("change",".tm_set_region",function(){o[Number(this.getAttribute("data-tab"))].region=String(this.value||"")}),m.on("click",".tm_set_remove",function(){o.splice(Number(this.getAttribute("data-tab")),1),h()}),m.on("click",".tm_set_addtab",function(w){if(w.preventDefault(),o.length>=B)return xt(m,`A set holds at most ${B} tabs.`);let R=this.getAttribute("data-role"),x=o.map(y=>y.roleArn).lastIndexOf(R);o.splice(x+1,0,{roleArn:R,service:"",region:x>=0?o[x].region:""}),h()}),m.on("change",".tm_set_addrole_select",function(){let w=String(this.value||"");if(!w)return;if(o.length>=B)return xt(m,`A set holds at most ${B} tabs.`);let R=vt(w);o.push({roleArn:w,service:R?String(R.$role.find(".tm_service_dropdown").val()||""):"",region:R?String(R.$role.find(".tm_region_dropdown").val()||""):""}),h()});let T=!1;m.on("click",function(w){w.target===this&&m.remove()}),m.find('[data-action="cancel"]').on("click",()=>m.remove()),m.find('[data-action="delete"]').on("click",async function(){if(!T){T=!0,this.textContent="Click again to delete",this.classList.add("tm_set_delete_armed");return}await tt.remove(e.id)&&(m.remove(),S(`Deleted ${e.name}.`,"info",r.TOAST_DURATION))}),m.find('[data-action="save"]').on("click",async()=>{let w=oo(m,e.id);if(w.error)return xt(m,w.error);if(!o.length)return xt(m,"A set needs at least one tab. Add one, or Delete the set.");await tt.upsert({...e,name:w.name,group:w.group,tabs:o})&&(m.remove(),S(`Saved ${w.name}.`,"success",r.TOAST_DURATION))})},pr=(t,e)=>{if(!/^\d{12}$/.test(String(t||""))||!e)return"";let o=`/${e}`,n=[...document.querySelectorAll('input[type="radio"][name="roleIndex"]')].find(a=>a.value.startsWith("arn:")&&a.value.split(":")[4]===t&&(a.value.endsWith(`:role${o}`)||a.value.endsWith(o))&&vt(a.value));return n?n.value:""},qo=t=>{let e=String(t||"").split(/[/?#]/)[0];if(!e)return"";let o=V.getServicesSync().find(n=>n&&typeof n.path=="string"&&n.path.split(/[/?#]/)[0]===e);return o?o.path:`${e}/home`},lr=()=>new Promise(t=>{try{chrome.runtime.sendMessage({type:"hop_list_console_tabs",region:X.region()},e=>t(chrome.runtime.lastError||!e||!e.ok?null:e.tabs))}catch{t(null)}}),mr=async()=>{let t=await lr();if(!t){S("Couldn't list your console tabs.","error",r.TOAST_DURATION_LONG);return}if(!t.length){S("No AWS console tabs are open.","info",r.TOAST_DURATION_LONG);return}i("#tm_set_tabs_modal").remove();let e=t.map(d=>{let g=pr(d.account,d.role),O=g?vt(g):null,N="";return d.role?g||(N="This role isn't in today's role list (a \u2933 jump or switched role)"):N="Can't tell which role this tab is (AWS multi-session off, or its session ended)",{...d,roleArn:g,info:O,why:N}}),o=new Map;e.forEach((d,g)=>{let O=d.groupId!==-1?`g${d.groupId}`:"none";o.has(O)||o.set(O,{title:d.group||(d.groupId!==-1?"Untitled group":""),grouped:d.groupId!==-1,idx:[]}),o.get(O).idx.push(g)});let n=[...o.values()].sort((d,g)=>Number(g.grouped)-Number(d.grouped)),a=d=>d.idx.filter(g=>e[g].roleArn).length,s=n.filter(d=>d.grouped).sort((d,g)=>a(g)-a(d))[0],l=s&&a(s)?new Set(s.idx):new Set(e.map((d,g)=>g)),m=s&&a(s)?s.title:"",h=d=>{let g=e[d],O=g.roleArn&&l.has(d)&&[...l].indexOf(d)<B,N=g.info&&g.info.env!=="default"?F.colorFor(g.info.env):"#ced4da",M=g.info?`${v(g.info.accountName)} \xB7 ${v(g.info.roleName)}`:`${v(g.account||"unknown account")}${g.role?` \xB7 ${v(g.role)}`:""}`;return`
        <label class="tm_set_pick tm_set_tabpick${g.roleArn?"":" tm_set_pick_off"}" title="${v(g.why||g.title)}">
          <input type="checkbox" data-row="${d}"${O?" checked":""}${g.roleArn?"":" disabled"}>
          <span class="tm_set_tabwho"><span class="tm_set_dot" style="background: ${v(N)} !important;"></span>${M}</span>
          <span class="tm_set_pick_where">${v(ue(g.path))}${g.region?` \xB7 ${v(g.region)}`:""}<small>${v(g.why||g.path)}</small></span>
        </label>`},T=n.map(d=>`
      <div class="tm_set_tabsec">
        <div class="tm_set_tabsec_head">
          <span>${d.grouped?`Tab group \xB7 ${v(d.title)}`:"Not in a tab group"}</span>
          ${n.length>1&&a(d)?`<a href="#" class="tm_set_only" data-rows="${d.idx.join(",")}" data-title="${v(d.grouped?d.title:"")}">only these</a>`:""}
        </div>
        ${d.idx.map(h).join("")}
      </div>`).join(""),w=`
      ${to(m,m)}
      <div class="tm_set_list_head"><span class="tm_set_count_label"></span></div>
      <div class="tm_set_picklist">${T}</div>
      <div class="tm_set_reopen">
        <span>Reopen each tab at</span>
        <label><input type="radio" name="tm_set_reopen" value="page" checked> the exact page</label>
        <label><input type="radio" name="tm_set_reopen" value="home"> the service's home</label>
      </div>`;i("body").append(Ze("tm_set_tabs_modal","Save open tabs as a set","Your open AWS console tabs, each with its role, region and page. <strong>Open</strong> on the set brings the same tabs back.",w,`
      <span></span>
      <span><button type="button" class="tm_sv_btn" data-action="cancel">Cancel</button>
      <button type="button" class="tm_sv_btn tm_set_primary" data-action="save">Save set</button></span>`,760));let x=i("#tm_set_tabs_modal");eo(x,!0);let y=()=>{let d=x.find(".tm_set_pick input:checked").length;x.find(".tm_set_count_label").text(`${lt(d,"tab")} selected${d>B?` \u2014 a set holds at most ${B}`:""}`)};y(),x.on("change",".tm_set_pick input",y),x.on("click",".tm_set_only",function(d){d.preventDefault();let g=new Set(this.getAttribute("data-rows").split(",").map(Number));x.find(".tm_set_pick input").each(function(){this.disabled||(this.checked=g.has(Number(this.getAttribute("data-row"))))});let O=this.getAttribute("data-title");O&&!x.find(".tm_set_name_input").val()&&(x.find(".tm_set_name_input").val(O),x.find(".tm_set_group_input").val(O)),y()}),x.on("click",function(d){d.target===this&&x.remove()}),x.find('[data-action="cancel"]').on("click",()=>x.remove()),x.find('[data-action="save"]').on("click",async()=>{let d=oo(x);if(d.error)return xt(x,d.error);let g=x.find(".tm_set_pick input:checked").get().map(L=>e[Number(L.getAttribute("data-row"))]);if(!g.length)return xt(x,"Tick at least one tab.");if(g.length>B)return xt(x,`A set holds at most ${B} tabs; untick ${g.length-B}.`);let O=(x.find('input[name="tm_set_reopen"]:checked').val()||"page")==="page",N=0,M=g.map(L=>{let f=O?L.path:qo(L.path);return Vt(f)||(f=qo(L.path),N++),Vt(f)||(f=""),{roleArn:L.roleArn,service:f,region:L.region}}),j={id:Jo(),name:d.name,group:d.group,tabs:M,lastUsed:0};await tt.upsert(j)&&(x.remove(),S(`Saved ${j.name} (${lt(j.tabs.length,"tab")})${N?`; ${N} will open on the service home`:""}.`,"success",r.TOAST_DURATION_LONG),we(j.id))}),x.find(".tm_set_name_input").trigger("focus")},Xo=()=>i("#tm_sets_menu").css("display","none");i("body").on("click","#tm_sets_new",function(t){t.preventDefault();let e=i("#tm_sets_menu");e.css("display",e.css("display")==="none"?"block":"none")}),i(document).on("click",function(t){(!t.target.closest||!t.target.closest("#tm_sets_new, #tm_sets_menu"))&&Xo()}),i("body").on("click","#tm_sets_menu [data-act]",function(t){t.preventDefault(),Xo();let e=this.getAttribute("data-act");e==="view"&&Vo(),e==="tabs"&&mr()}),i("body").on("click","#tm_search_saveset_btn",function(t){t.preventDefault(),Vo()}),i("body").on("click",".tm_set_chip",function(t){t.preventDefault();let e=this.getAttribute("data-set-id");Y&&Y.id===e?Xe():we(e)}),i("body").on("click",".tm_set_open",function(t){t.preventDefault(),!this.disabled&&ar(this.getAttribute("data-set-id"))}),i("body").on("click","#tm_sets_more",function(t){t.preventDefault(),xe=!xe,tt.render()}),i("body").on("click","#tm_set_bar_close",function(t){t.preventDefault(),Xe()}),i("body").on("click","#tm_set_bar_edit",function(t){t.preventDefault(),Y&&cr(Y.id)}),i("h1.background").remove(),i("form p").each(function(){this.textContent.includes("Select a role:")&&this.remove()}),i("#signin_button").parent().hide();let dr=`
        <div id="tm_interface_wrapper">
            <div class="tm_main_layout">
                <div class="tm_left_column">
                    <div class="tm_frow">
                        <span class="tm_frow_label">Organizations</span>
                        <div class="tm_frow_body"><div class="tm_button_group" data-filter-group="org"></div></div>
                    </div>
                    <div class="tm_frow">
                        <span class="tm_frow_label">Environments</span>
                        <div class="tm_frow_body"><div class="tm_button_group" data-filter-group="env"></div></div>
                    </div>
                    <div class="tm_frow">
                        <span class="tm_frow_label">Account types</span>
                        <div class="tm_frow_body"><div class="tm_button_group" data-filter-group="type"></div></div>
                    </div>
                    <div class="tm_frow">
                        <span class="tm_frow_label">Roles</span>
                        <div class="tm_frow_body"><div class="tm_button_group" data-filter-group="role"></div></div>
                    </div>
                    <div class="tm_frow">
                        <span class="tm_frow_label">Source</span>
                        <div class="tm_frow_body"><div class="tm_button_group" data-filter-group="source">
                            <a href="#" class="tm_filter_button" data-group="source" data-filter="direct" title="Roles granted directly by today's sign-in">Direct roles</a>
                            <a href="#" class="tm_filter_button" data-group="source" data-filter="jump" title="Saved destinations reached by chaining through a hub">\u2933 Jumps</a>
                        </div></div>
                    </div>
                    <div class="tm_frow">
                        <span class="tm_frow_label">Tags</span>
                        <div class="tm_frow_body"><div class="tm_button_group" data-filter-group="tag"></div></div>
                    </div>
                    <div class="tm_frow tm_frow_shortcuts">
                        <span class="tm_frow_label">Shortcuts</span>
                        <div class="tm_frow_body tm_shortcuts_section">
                            <div class="tm_button_group">
                                <a href="#" class="tm_filter_button" data-group="show" data-filter="favorites">Favorites</a>
                                <a href="#" class="tm_filter_button" data-group="show" data-filter="recent">Recent</a>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="tm_sets_column" id="tm_sets_column">
                    <div class="tm_sets_head">
                        <span class="tm_frow_label">Sets</span>
                        <div class="tm_sets_new_wrap">
                            <button type="button" id="tm_sets_new" title="Save a set of console tabs to open together">+ New set \u25BE</button>
                            <div id="tm_sets_menu" style="display: none;">
                                <a href="#" data-act="view" title="Every role the listing shows now, with its service and region">Save current view\u2026</a>
                                <a href="#" data-act="tabs" title="Your open AWS console tabs, each with its role, region and page">Save open tabs\u2026</a>
                            </div>
                        </div>
                    </div>
                    <div id="tm_sets_list"></div>
                </div>
                <div class="tm_right_column">
                    <div id="tm_search_container">
                        <div id="tm_search_pop">
                            <div id="tm_search_field">
                                <input type="text" id="tm_search_input" placeholder="Find account..." autocomplete="off">
                                <button type="button" id="tm_search_clear" class="tm_field_clear" aria-label="Clear search" title="Clear" tabindex="-1"><svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none"></path></svg></button>
                            </div>
                            <div id="tm_search_suggest"></div>
                            <div id="tm_search_foot">
                                <div id="tm_search_save">
                                    <button type="button" id="tm_search_save_btn" title="Save this search and its filters as a reusable Shortcut">\u2606 save as shortcut</button>
                                    <button type="button" id="tm_search_saveset_btn" title="Save the roles this search shows as a Launch Set \u2014 open them all in one click">\u2197 save as set</button>
                                    <span id="tm_search_save_form">
                                        <input type="text" id="tm_search_save_name" placeholder="shortcut name" autocomplete="off" maxlength="40">
                                        <button type="button" id="tm_search_save_go">save</button>
                                    </span>
                                </div>
                                <div id="tm_search_matchcount"></div>
                            </div>
                        </div>
                    </div>
                    <div id="tm_jump_section" style="display: none;">
                        <div class="tm_col_divider"></div>
                        <div id="tm_jump_bar" style="position: relative;">
                        <button type="button" id="tm_jump_pill" title="Sign into a hub, then switch into an account you can only reach by assuming a role" style="
                            display: flex !important; align-items: center !important; justify-content: center !important; gap: 6px !important;
                            width: 100% !important; box-sizing: border-box !important; padding: 7px 12px !important;
                            border: 1px solid #0073bb !important; border-radius: 6px !important;
                            background: white !important; color: #0073bb !important; cursor: pointer !important; font-size: 13px !important;
                        ">\u2933 Jump to account</button>
                        <div id="tm_jump_popover" style="
                            display: none; position: absolute !important; top: calc(100% + 6px) !important; right: 0 !important; left: auto !important;
                            z-index: 10000 !important; width: 300px !important; background: white !important;
                            border: 1px solid #ccc !important; border-radius: 8px !important;
                            box-shadow: 0 8px 24px rgba(0,0,0,0.18) !important; padding: 12px !important; text-align: left !important;
                        ">
                            <div style="display: flex !important; gap: 6px !important; margin-bottom: 8px !important;">
                                <select id="tm_jump_org" title="Org / assume profile" style="
                                    flex: 0 0 42% !important; padding: 6px 6px !important; border: 1px solid #ccc !important;
                                    border-radius: 4px !important; font-size: 12px !important; background: white !important; color: #16191f !important;
                                "></select>
                                <div id="tm_jump_account_wrap" style="position: relative !important; flex: 1 !important; min-width: 0 !important;">
                                    <input id="tm_jump_account" type="text" placeholder="destination account id" autocomplete="off" style="
                                        width: 100% !important; padding: 6px 28px 6px 8px !important; border: 1px solid #ccc !important;
                                        border-radius: 4px !important; font-size: 12px !important; box-sizing: border-box !important; min-width: 0 !important;
                                    " />
                                    <button type="button" id="tm_jump_account_clear" class="tm_field_clear" aria-label="Clear account id" title="Clear" tabindex="-1"><svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none"></path></svg></button>
                                </div>
                            </div>
                            <div id="tm_jump_region_wrap" style="margin-bottom: 8px !important;">
                                <select id="tm_jump_region" title="AWS region to land in after the jump \u2014 defaults to your General Settings region" style="
                                    width: 100% !important; padding: 6px 6px !important; border: 1px solid #ccc !important;
                                    border-radius: 4px !important; font-size: 12px !important; background: white !important; color: #16191f !important; box-sizing: border-box !important;
                                "></select>
                            </div>
                            <div id="tm_jump_label_wrap" style="position: relative !important; margin-bottom: 8px !important;">
                                <input id="tm_jump_label" type="text" placeholder="session label (optional)" autocomplete="off" style="
                                    width: 100% !important; padding: 6px 28px 6px 8px !important; border: 1px solid #ccc !important;
                                    border-radius: 4px !important; font-size: 12px !important; box-sizing: border-box !important;
                                " />
                                <button type="button" id="tm_jump_label_clear" class="tm_field_clear" aria-label="Clear label" title="Clear" tabindex="-1"><svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none"></path></svg></button>
                            </div>
                            <label id="tm_jump_save_wrap" title="Also save this destination \u2014 it becomes a \u2933 row in the listing, managed via Jump Destinations in the side menu" style="
                                display: flex !important; gap: 6px !important; align-items: center !important;
                                margin-bottom: 8px !important; font-size: 12px !important; color: #545b64 !important; cursor: pointer !important;
                            "><input type="checkbox" id="tm_jump_save_dest" style="margin: 0 !important;" />Save as a named destination</label>
                            <button type="button" id="tm_jump_go" style="
                                width: 100% !important; padding: 7px !important; border: 1px solid #0073bb !important; background: #0073bb !important;
                                color: white !important; border-radius: 4px !important; cursor: pointer !important; font-size: 12px !important;
                            ">Jump \u2192</button>
                            <div id="tm_jump_recents"></div>
                        </div>
                        </div>
                    </div>
                    <div class="tm_col_divider"></div>
                    <select id="tm_group_mode_select" class="tm_group_mode_select" title="How the console tabs you open are grouped in Chrome">
                        <option value="role">Tabs: By role</option>
                        <option value="org">Tabs: By org</option>
                        <option value="custom">Tabs: Custom tag</option>
                        <option value="off">Tabs: Off</option>
                    </select>
                    <div id="tm_group_tag_field" class="tm_group_tag_field" style="display: none;">
                        <input id="tm_group_tag_input" class="tm_group_tag_input" type="text" placeholder="INC-4821" autocomplete="off" />
                        <button type="button" id="tm_group_tag_clear" class="tm_field_clear" aria-label="Clear tag" title="Clear tag" tabindex="-1"><svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none"></path></svg></button>
                    </div>
                    <div id="tm_sessions_section" style="display: none;">
                        <div id="tm_sessions_bar" style="position: relative;">
                            <button type="button" id="tm_sessions_pill" title="AWS allows 5 concurrent console sessions \u2014 click to review or sign one out">
                                <span id="tm_sessions_pill_text">sessions</span>
                            </button>
                            <div id="tm_sessions_scrim" style="display: none;"></div>
                            <div id="tm_sessions_popover" style="display: none;">
                                <div id="tm_sessions_head">
                                    <span id="tm_sessions_title">Active AWS sessions</span>
                                    <span id="tm_sessions_close" role="button" tabindex="-1" aria-label="Close" title="Close">&#10005;</span>
                                </div>
                                <div id="tm_sessions_rows"></div>
                                <div id="tm_sessions_foot">
                                    <div id="tm_sessions_hint">Sign out a session to free a slot for a new sign-in.</div>
                                    <button type="button" id="tm_sess_signout_all" title="Sign out of every AWS console session \u2014 needs a second click to confirm">Sign out all sessions</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,ur=`
        <div id="tm_actions_container">
            <div id="tm_actions_scroll">
                <div class="tm_menu_header">View</div>
                <a href="#" class="tm_action_button" id="tm_theme_toggle">Theme: Light</a>
                <a href="#" class="tm_action_button" id="tm_compact_toggle">Compact: Off</a>
                <a href="#" class="tm_action_button" id="tm_signin_tab_toggle">Sign-in: Same tab</a>
                <a href="#" class="tm_action_button" id="tm_recent_limit">Recent: 10</a>
                <a href="#" class="tm_action_button" id="tm_tab_group_mode">Tab Groups: By role</a>
                <a href="#" class="tm_action_button" id="tm_start_view">Start View: Off</a>
                <div class="tm_menu_header">Configure</div>
                <a href="#" class="tm_action_button" id="tm_manage_shortcuts">Shortcuts</a>
                <a href="#" class="tm_action_button" id="tm_manage_organizations">Organizations</a>
                <a href="#" class="tm_action_button" id="tm_manage_environments">Environments</a>
                <a href="#" class="tm_action_button" id="tm_manage_types">Account Types</a>
                <a href="#" class="tm_action_button" id="tm_manage_role_names">Role Names</a>
                <a href="#" class="tm_action_button" id="tm_manage_services">Services</a>
                <a href="#" class="tm_action_button" id="tm_manage_regions">Regions</a>
                <a href="#" class="tm_action_button" id="tm_manage_account_names">Account Names</a>
                <a href="#" class="tm_action_button" id="tm_manage_account_tags">Account Tags</a>
                <a href="#" class="tm_action_button" id="tm_manage_assume_profiles">Jump Profiles</a>
                <a href="#" class="tm_action_button" id="tm_manage_jump_dests">Jump Destinations</a>
                <a href="#" class="tm_action_button" id="tm_general_settings">General Settings</a>
                <div class="tm_menu_header">Data</div>
                <a href="#" class="tm_action_button" id="tm_export_settings">Export Settings</a>
                <a href="#" class="tm_action_button" id="tm_import_settings">Import Settings</a>
                <a href="#" class="tm_action_button" id="tm_reset_order">Reset Order</a>
                <a href="#" class="tm_action_button" id="tm_reset_recent">Reset Recent</a>
                <a href="#" class="tm_action_button" id="tm_clear_sessions">Clear AWS Sessions</a>
                <div class="tm_menu_header">Help</div>
                <a href="#" class="tm_action_button" id="tm_keyboard_help">Keyboard Shortcuts</a>
                <a href="#" class="tm_action_button" id="tm_about">Help / About</a>
            </div>
        </div>
    `,_r=`
        <div id="tm_footer">
            <span id="tm_footer_text">Console Hopper v${r.SCRIPT_VERSION}</span><span id="tm_footer_homepage_wrap" style="display:none !important;"> | <a id="tm_footer_homepage" href="#" target="_blank" rel="noopener">Homepage</a></span> | <a id="tm_footer_privacy" href="https://github.com/tomekklas/console-hopper/blob/main/PRIVACY.md" target="_blank" rel="noopener">Privacy</a>
        </div>
    `,no=t=>/^https?:\/\//i.test(String(t||"").trim()),Qo=()=>{let t=(Gt||"").trim(),e=no(t)?t:"",o=i("#tm_footer_homepage_wrap"),n=i("#tm_footer_homepage");!o.length||!n.length||(e?(n.attr("href",e),o[0].style.setProperty("display","inline","important")):o[0].style.setProperty("display","none","important"))},Zo=i("#saml_form");if(Zo.length){Zo.prepend(dr),i("body").append(ur);let t=i("#smallprint");t.length&&t.prepend(_r)}let gr=`
        body {
            font-family: 'Amazon Ember', 'Helvetica Neue', sans-serif !important;
            transition: background-color 0.3s ease, color 0.3s ease !important;
        }

        #saml_form {
            max-width: 1100px !important;
            margin: 20px auto 20px auto !important;
            padding: 0 20px !important;
        }

        body.tm_theme_light {
            background-color: #f8f9fa !important;
            color: #16191f !important;
        }

        body.tm_theme_dark {
            background-color: #1a1d23 !important;
            color: #e9ecef !important;
        }

        body.tm_theme_dark #tm_interface_wrapper {
            background-color: #2d3748 !important;
            border-color: #4a5568 !important;
            color: #e9ecef !important;
        }

        body.tm_theme_dark .tm_frow_label {
            color: #a0aec0 !important;
        }

        body.tm_theme_dark .tm_filter_button {
            background-color: #4a5568 !important;
            color: #e9ecef !important;
            border-color: #6b7280 !important;
        }

        body.tm_theme_dark .tm_filter_button:hover {
            background-color: #5a6578 !important;
        }

        body.tm_theme_dark .tm_filter_button.active {
            background-color: #3182ce !important;
            border-color: #3182ce !important;
        }

        /* The generic dark rule above sets a uniform border, which would
           otherwise clobber the per-entry env/org/type color (lower specificity
           in the light-mode [data-color] rule). Restore the colored border in
           dark mode with a more specific selector. */
        body.tm_theme_dark .tm_filter_button[data-color] {
            border-color: var(--tm-fb-color, #6b7280) !important;
        }
        body.tm_theme_dark .tm_filter_button[data-color].active {
            background-color: var(--tm-fb-color, #3182ce) !important;
            border-color: var(--tm-fb-color, #3182ce) !important;
        }

        body.tm_theme_dark #tm_search_input {
            background-color: #4a5568 !important;
            color: #e9ecef !important;
            border-color: #6b7280 !important;
        }

        body.tm_theme_dark #tm_search_input::placeholder {
            color: #a0aec0 !important;
        }

        body.tm_theme_dark .saml-role {
            background-color: #2d3748 !important;
            border-color: #4a5568 !important;
            color: #e9ecef !important;
        }

        body.tm_theme_dark .saml-role:hover {
            border-color: #3182ce !important;
            background-color: #374151 !important;
        }

        body.tm_theme_dark .tm_account_name {
            color: #e9ecef !important;
        }

        body.tm_theme_dark .tm_account_id {
            color: #a0aec0 !important;
        }

        body.tm_theme_dark .tm_role_name {
            color: #e9ecef !important;
        }

        body.tm_theme_dark .tm_role_button {
            background-color: #4a5568 !important;
            color: #e9ecef !important;
            border-color: #6b7280 !important;
        }

        body.tm_theme_dark .tm_role_button:hover {
            background-color: #5a6578 !important;
        }

        body.tm_theme_dark .tm_role_button.primary {
            background-color: #3182ce !important;
            border-color: #3182ce !important;
        }

        body.tm_theme_dark .tm_role_button.primary:hover {
            background-color: #2c5aa0 !important;
        }

        body.tm_theme_dark .tm_favorite_button {
            background-color: #4a5568 !important;
            color: #d69e2e !important;
            border-color: #d69e2e !important;
        }

        body.tm_theme_dark .tm_favorite_button:hover {
            background-color: #553c0a !important;
        }

        body.tm_theme_dark .tm_favorite_button.favorited {
            background-color: #d69e2e !important;
            color: #1a202c !important;
            border-color: #d69e2e !important;
        }

        body.tm_theme_dark .tm_favorite_button.favorited:hover {
            background-color: #b7791f !important;
            border-color: #b7791f !important;
        }

        body.tm_theme_dark .tm_action_button {
            background-color: #4a5568 !important;
            color: #e9ecef !important;
            border-color: #6b7280 !important;
        }

        body.tm_theme_dark .tm_action_button:hover {
            background-color: #5a6578 !important;
        }

        #tm_interface_wrapper {
            background-color: #fafafa !important;
            border: 1px solid #e7e7e7 !important;
            border-radius: 4px !important;
            padding: 15px !important;
            margin-bottom: 0px !important;
            transition: background-color 0.3s ease, border-color 0.3s ease !important;
        }

        .tm_main_layout {
            display: flex !important;
            gap: 0px !important;
            align-items: stretch !important;
        }

        .tm_left_column {
            flex: 1 1 auto !important;
            min-width: 0 !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 9px !important;
            padding-right: 15px !important;
        }

        .tm_right_column {
            flex: 0 0 200px !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 9px !important;
            padding-left: 15px !important;
            border-left: 1px solid #f0f0f0 !important;
        }

        body.tm_theme_dark .tm_right_column {
            border-left-color: #3a4148 !important;
        }

        /* Dedicated "Tab group" area between the filters and the search / jump
           rail: one dropdown (By role / By org / Custom tag / Off) with a tag
           field that appears only when Custom tag is chosen. */
        /* Find / Jump / Tabs stack vertically in one column, each fenced off by
           a hairline. Divider margin is 0 \u2014 the column's flex gap (and the jump
           section's) provides even 9px space on both sides of each rule. Every
           control self-labels, so there are no headings. */
        .tm_col_divider {
            border-top: 1px solid #ededed !important;
            margin: 0 !important;
        }
        body.tm_theme_dark .tm_col_divider {
            border-top-color: #3a4148 !important;
        }
        /* Flex so the divider inside it gets the same 9px gap as the top-level
           column. display is intentionally NOT !important so the inline
           display:none toggle (refreshJumpBar) can still hide the whole block. */
        #tm_jump_section {
            display: flex;
            flex-direction: column !important;
            gap: 9px !important;
        }
        /* Active-session chip: the last control in the rail, below Tabs and
           fenced by the same hairline. Non-!important display so the JS
           show/hide toggle still wins. */
        #tm_sessions_section {
            display: flex;
            flex-direction: column !important;
            gap: 9px !important;
        }
        #tm_sessions_pill {
            display: flex !important; align-items: center !important; justify-content: center !important;
            gap: 6px !important; width: 100% !important; box-sizing: border-box !important;
            padding: 7px 10px !important; border: 1px solid #ccc !important; border-radius: 6px !important;
            background: white !important; color: #545b64 !important; cursor: pointer !important;
            font-size: 12px !important; white-space: nowrap !important; overflow: hidden !important;
            text-overflow: ellipsis !important;
        }
        #tm_sessions_pill:hover { border-color: #8a9199 !important; }
        /* One slot left, then none. */
        #tm_sessions_pill.tm_sessions_warn {
            border-color: #e0a800 !important; background: #fdf6e3 !important; color: #7a5b12 !important;
        }
        #tm_sessions_pill.tm_sessions_full {
            border-color: #c0392b !important; background: #fbeae8 !important; color: #8a2d24 !important;
        }
        /* Wider than the 200px rail: the row detail needs the room, so the
           popover opens upward and to the left, over the role list \u2014 the same
           overlay trick the Jump popover uses. */
        /* Opens DOWNWARD like the Jump popover: the rail's chip sits low, so
           opening upward buried the filter rows and ran off the top of the
           page \u2014 the space below the picker is empty anyway. */
        #tm_sessions_popover {
            position: absolute !important; top: calc(100% + 6px) !important; right: 0 !important; left: auto !important;
            z-index: 10000 !important; width: 1100px !important; max-width: calc(100vw - 60px) !important;
            background: white !important; border: 1px solid #ccc !important; border-radius: 8px !important;
            box-shadow: 0 10px 28px rgba(0,0,0,0.20) !important; padding: 12px 14px !important; text-align: left !important;
        }
        #tm_sessions_head {
            display: flex !important; justify-content: space-between !important; align-items: center !important;
            font-size: 15px !important; font-weight: 600 !important; color: #16191f !important;
            padding-bottom: 8px !important; border-bottom: 1px solid #ededed !important;
        }
        #tm_sessions_close { cursor: pointer !important; color: #8a9199 !important; font-size: 14px !important; }
        #tm_sessions_close:hover { color: #16191f !important; }
        .tm_sess_th, .tm_sess_tr {
            display: grid !important;
            /* The three time/count columns are sized to their VALUES ("13m ago",
               "47m", "1") \u2014 their headers are the widest thing in them, so any
               extra width there is dead space stolen from the two columns that
               actually truncate. */
            grid-template-columns: 1fr 2fr 100px 230px 68px 60px 40px 28px !important;
            gap: 16px !important; align-items: center !important;
        }
        /* Horizontal padding on the rows (matched by the header so columns stay
           aligned) keeps the hover highlight off the text and off the \u2715. */
        .tm_sess_th { font-size: 12px !important; color: #8a9199 !important; padding: 10px 12px 8px !important; border-bottom: 1px solid #f2f4f5 !important; }
        .tm_sess_tr { font-size: 13px !important; color: #16191f !important; padding: 13px 12px !important; line-height: 1.4 !important; border-bottom: 1px solid #f7f8f9 !important; border-radius: 4px !important; }
        .tm_sess_tr:hover { background: #f7f8f9 !important; }
        /* Every cell is single-line with an ellipsis, so no account name or role
           can push the grid out of shape; the full value is in the title. */
        .tm_sess_name, .tm_sess_meta {
            overflow: hidden !important; text-overflow: ellipsis !important; white-space: nowrap !important;
        }
        .tm_sess_meta { color: #545b64 !important; }
        /* A fixed square centred on its own glyph \u2014 the hover/armed background
           has to sit squarely behind the \u2715, not float off to one side of the
           grid cell (which is what text-align + padding did). */
        .tm_sess_del {
            display: inline-flex !important; align-items: center !important; justify-content: center !important;
            width: 22px !important; height: 22px !important; box-sizing: border-box !important;
            justify-self: end !important; color: #c7ccd1 !important; cursor: pointer !important;
            font-size: 13px !important; line-height: 1 !important; border-radius: 4px !important;
        }
        .tm_sess_del:hover { color: #c0392b !important; background-color: #fbeae8 !important; }
        .tm_sess_del.tm_confirm_del {
            color: white !important; background-color: #c0392b !important; font-size: 11px !important;
        }
        /* While the panel is open a near-invisible scrim sits between it and
           the page. It exists to EAT clicks: the \u2715 column and the sign-out-all
           button align directly over the listing's Sign In buttons, so a stray
           click (especially right after the panel changes under the pointer)
           must never fall through and sign into an account. */
        #tm_sessions_scrim {
            position: fixed !important; top: 0 !important; left: 0 !important;
            right: 0 !important; bottom: 0 !important; z-index: 9999 !important;
            background: rgba(0, 0, 0, 0.12) !important;
        }
        #tm_sessions_foot {
            display: flex !important; justify-content: space-between !important;
            align-items: center !important; gap: 16px !important; padding-top: 8px !important;
        }
        #tm_sessions_hint { font-size: 12px !important; color: #8a9199 !important; flex: 1 !important; }
        #tm_sess_signout_all {
            border: 1px solid #c0392b !important; color: #c0392b !important; background: #fff !important;
            border-radius: 4px !important; padding: 6px 12px !important; font-size: 12px !important;
            cursor: pointer !important; white-space: nowrap !important;
        }
        #tm_sess_signout_all:hover { background: #fbeae8 !important; }
        #tm_sess_signout_all.tm_confirm_del { background: #c0392b !important; color: #fff !important; }
        body.tm_theme_dark #tm_sessions_scrim { background: rgba(0, 0, 0, 0.35) !important; }
        body.tm_theme_dark #tm_sess_signout_all { background: #232830 !important; }
        body.tm_theme_dark #tm_sess_signout_all.tm_confirm_del { background: #c0392b !important; color: #fff !important; }
        #tm_sessions_empty { font-size: 13px !important; color: #8a9199 !important; padding: 10px 0 !important; }
        body.tm_theme_dark #tm_sessions_pill { background: #2a2f36 !important; border-color: #3a4148 !important; color: #c7ccd1 !important; }
        body.tm_theme_dark #tm_sessions_pill.tm_sessions_warn { background: #3a3320 !important; border-color: #7a5b12 !important; color: #f0c36d !important; }
        body.tm_theme_dark #tm_sessions_pill.tm_sessions_full { background: #3d2422 !important; border-color: #8a2d24 !important; color: #e8a49c !important; }
        body.tm_theme_dark #tm_sessions_popover { background: #232830 !important; border-color: #3a4148 !important; }
        body.tm_theme_dark #tm_sessions_head { color: #e9ecef !important; border-bottom-color: #3a4148 !important; }
        body.tm_theme_dark .tm_sess_tr { color: #e9ecef !important; border-bottom-color: #2f353d !important; }
        body.tm_theme_dark .tm_sess_tr:hover { background: #2a2f36 !important; }
        body.tm_theme_dark .tm_sess_meta { color: #adb5bd !important; }
        .tm_group_mode_select {
            width: 100% !important;
            box-sizing: border-box !important;
            height: 32px !important;
            padding: 0 8px !important;
            border: 1px solid #adb5bd !important;
            border-radius: 4px !important;
            background-color: #fff !important;
            color: #16191f !important;
            font-size: 14px !important;
            font-family: inherit !important;
            cursor: pointer !important;
        }
        .tm_group_mode_select:focus {
            outline: none !important;
            border-color: #0073bb !important;
            box-shadow: 0 0 0 2px rgba(0,115,187,0.15) !important;
        }
        body.tm_theme_dark .tm_group_mode_select {
            background-color: #2d3748 !important;
            color: #e9ecef !important;
            border-color: #6b7280 !important;
        }

        /* One filter category per row: a fixed right-aligned label seam on the
           left, wrapping chips on the right. Baseline-aligned so the label sits
           with the first row of chips even when the group wraps to two lines. */
        .tm_frow {
            display: flex !important;
            align-items: baseline !important;
            gap: 11px !important;
        }

        /* A filter row with fewer than two options is hidden (see
           updateFilterRowVisibility). Higher specificity than the rule above so
           the !important display:none wins regardless of source order. */
        .tm_frow.tm_frow_hidden {
            display: none !important;
        }

        /* When no filter rows are visible above it, the Shortcuts row's top
           divider separates nothing \u2014 drop it. */
        .tm_frow.tm_frow_bare {
            border-top: none !important;
            padding-top: 0 !important;
            margin-top: 0 !important;
        }

        .tm_frow_label {
            flex: 0 0 96px !important;
            text-align: right !important;
            font-size: 12px !important;
            color: #687078 !important;
            line-height: 1.6 !important;
        }

        .tm_frow_body {
            flex: 1 1 auto !important;
            min-width: 0 !important;
            display: flex !important;
            flex-wrap: wrap !important;
            align-items: center !important;
            gap: 8px !important;
        }

        /* Favorites / Recent live in their own footer row, fenced off from the
           filters above with a hairline. */
        .tm_frow_shortcuts {
            align-items: center !important;
            border-top: 1px solid #f0f0f0 !important;
            padding-top: 9px !important;
            margin-top: 1px !important;
        }

        body.tm_theme_dark .tm_frow_shortcuts {
            border-top-color: #3a4148 !important;
        }

        .tm_button_group {
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 8px !important;
        }

        .tm_filter_button {
            padding: 4px 12px !important;
            border: 1px solid #adb5bd !important;
            border-radius: 15px !important;
            text-decoration: none !important;
            color: #16191f !important;
            cursor: pointer !important;
            font-size: 13px !important;
            background-color: #fff !important;
            transition: all 0.2s ease !important;
        }

        /* Inline "remove shortcut" \u2715 on saved-view chips. Subtle by default,
           brighter on hover; a first click arms .tm_confirm_del (whole chip goes
           red = "click again to remove"), so deletion always takes two clicks. */
        .tm_shortcut_del {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 15px !important;
            height: 15px !important;
            margin-left: 6px !important;
            margin-right: -3px !important;
            border-radius: 50% !important;
            font-size: 10px !important;
            line-height: 1 !important;
            color: #99a0a8 !important;
            vertical-align: middle !important;
            transition: color 0.12s ease, background-color 0.12s ease !important;
        }
        .tm_shortcut_del:hover { color: #c0392b !important; background-color: #fbeae8 !important; }
        .tm_custom_shortcut.tm_confirm_del {
            border-color: #c0392b !important;
            background-color: #fbeae8 !important;
            color: #c0392b !important;
        }
        .tm_custom_shortcut.tm_confirm_del .tm_shortcut_del {
            color: #fff !important;
            background-color: #c0392b !important;
        }
        body.tm_theme_dark .tm_shortcut_del { color: #8a94a0 !important; }
        body.tm_theme_dark .tm_shortcut_del:hover { color: #f0a0a0 !important; background-color: #4a2222 !important; }
        body.tm_theme_dark .tm_custom_shortcut.tm_confirm_del {
            border-color: #e06060 !important;
            background-color: #4a2222 !important;
            color: #f0a0a0 !important;
        }
        body.tm_theme_dark .tm_custom_shortcut.tm_confirm_del .tm_shortcut_del {
            color: #4a2222 !important;
            background-color: #f0a0a0 !important;
        }

        /* Tag field for the "Custom tag" grouping choice \u2014 shown only when the
           dropdown above is set to Custom tag. Its value groups every Sign In
           under that tag until another grouping option is picked. */
        .tm_group_tag_input {
            width: 100% !important;
            box-sizing: border-box !important;
            height: 32px !important;
            padding: 0 30px 0 8px !important;
            border: 1px solid #0073bb !important;
            border-radius: 4px !important;
            color: #16191f !important;
            font-size: 14px !important;
            background-color: #fff !important;
            outline: none !important;
            font-family: inherit !important;
        }
        .tm_group_tag_input::placeholder { color: #8a9199 !important; font-style: italic !important; }
        .tm_group_tag_input:focus {
            box-shadow: 0 0 0 2px rgba(0,115,187,0.15) !important;
        }
        body.tm_theme_dark .tm_group_tag_input {
            background-color: #2d3748 !important;
            color: #e9ecef !important;
            border-color: #0073bb !important;
        }

        /* Clearable field: an \u2715 button overlaid at the right that empties the
           field and refocuses it \u2014 shown only when the wrapping element carries
           .tm_has_value. Shared by the custom-tag field and the Jump account-id
           field so both clear the same way. */
        .tm_group_tag_field {
            position: relative !important;
            width: 100% !important;
        }
        .tm_field_clear {
            position: absolute !important;
            top: 50% !important;
            right: 5px !important;
            transform: translateY(-50%) !important;
            display: none !important;
            align-items: center !important;
            justify-content: center !important;
            width: 22px !important;
            height: 22px !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            background: transparent !important;
            color: #8a9199 !important;
            cursor: pointer !important;
            border-radius: 4px !important;
            transition: background-color 0.12s ease, color 0.12s ease !important;
        }
        .tm_has_value > .tm_field_clear {
            display: flex !important;
        }
        .tm_field_clear:hover {
            color: #16191f !important;
            background: #eef2f6 !important;
        }
        /* Dark treatment applies to the main-panel fields (custom tag + search),
           which sit on the dark panel; the Jump popover is always white, so its
           clear buttons keep the light styling above. */
        body.tm_theme_dark #tm_group_tag_field .tm_field_clear,
        body.tm_theme_dark #tm_search_container .tm_field_clear {
            color: #9aa0a6 !important;
        }
        body.tm_theme_dark #tm_group_tag_field .tm_field_clear:hover,
        body.tm_theme_dark #tm_search_container .tm_field_clear:hover {
            color: #e9ecef !important;
            background: #3a4148 !important;
        }

        .tm_filter_button:hover {
            background-color: #e9ecef !important;
        }

        .tm_filter_button.active {
            background-color: #0073bb !important;
            color: #fff !important;
            border-color: #0073bb !important;
        }

        /* Active chips otherwise have no hover affordance \u2014 the .active
           background wins over :hover at the same specificity. Use a
           brightness filter so the same rule covers every active state
           (built-in blue, per-entry --tm-fb-color, and the dark-theme
           variants) without per-colour overrides. */
        .tm_filter_button.active:hover {
            filter: brightness(0.9) !important;
        }

        /* Per-entry color (env/org/type/role) is applied inline at render
           time. .tm_filter_button[style*=...] CSS would be unmaintainable, so
           we just override .active with a tinted state via JS-set CSS vars. */
        .tm_filter_button[data-color] {
            border-color: var(--tm-fb-color, #adb5bd) !important;
        }
        .tm_filter_button[data-color].active {
            background-color: var(--tm-fb-color, #0073bb) !important;
            border-color: var(--tm-fb-color, #0073bb) !important;
            color: #fff !important;
        }

        /* --- Search: a compact box in the 200px rail that pops out into a wide
           floating card on focus (mirrors the Jump popover). The container
           reserves a fixed 32px slot; #tm_search_pop is an absolute child that
           fills that slot when collapsed and grows into a card while the input
           is focused (:focus-within). There is no second input \u2014 the same
           #tm_search_input is simply restyled, so search state stays single-
           source. Suggest + match count are in-flow inside the card and hidden
           when collapsed, so the rail slot stays clean. */
        #tm_search_container {
            width: 100% !important;
            position: relative !important;
            height: 32px !important;
        }
        #tm_search_pop {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            z-index: 1002 !important;
            box-sizing: border-box !important;
            border: 1px solid transparent !important;
            border-radius: 8px !important;
            transition: box-shadow 0.12s ease, border-color 0.12s ease !important;
        }
        #tm_search_field { position: relative !important; }

        #tm_search_input {
            width: 100% !important;
            box-sizing: border-box !important;
            height: 32px !important;
            padding: 0 32px 0 10px !important;
            border: 1px solid #adb5bd !important;
            border-radius: 4px !important;
            font-size: 14px !important;
            transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease !important;
        }

        /* Expanded: the box is focused \u2192 float a wide card leftward over the list. */
        #tm_search_container:focus-within #tm_search_pop {
            left: auto !important;
            width: 400px !important;
            max-width: calc(100vw - 60px) !important;
            top: -7px !important;
            padding: 6px !important;
            background: #fff !important;
            border-color: #0073bb !important;
            box-shadow: 0 8px 24px rgba(0,0,0,0.15) !important;
        }
        #tm_search_container:focus-within #tm_search_input {
            height: 36px !important;
            border-color: #0073bb !important;
        }

        /* Autocomplete + legend + live match count: in-flow inside the card,
           revealed only while the box is focused. */
        #tm_search_suggest { display: none !important; margin-top: 8px !important; }
        #tm_search_container:focus-within #tm_search_suggest { display: block !important; }
        /* Footer: "save as shortcut" on the left, live match count on the right.
           Only shown when there is actually something to save or count (JS adds
           .tm_foot_on), so an empty box stays clean. */
        #tm_search_foot { display: none !important; }
        #tm_search_container:focus-within #tm_search_foot.tm_foot_on {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            gap: 8px !important;
            margin-top: 8px !important;
            padding-top: 7px !important;
            border-top: 1px solid #ededed !important;
        }
        #tm_search_matchcount {
            font-size: 12px !important;
            color: #0073bb !important;
            font-weight: 600 !important;
            white-space: nowrap !important;
        }
        #tm_search_save_btn {
            display: inline-flex !important;
            align-items: center !important;
            gap: 4px !important;
            border: 1px solid #d5d9de !important;
            background: transparent !important;
            color: #57606a !important;
            border-radius: 4px !important;
            padding: 3px 8px !important;
            font-size: 11.5px !important;
            font-family: inherit !important;
            cursor: pointer !important;
        }
        #tm_search_save_btn:hover { border-color: #0073bb !important; color: #0073bb !important; }
        #tm_search_saveset_btn {
            display: inline-flex !important; align-items: center !important; gap: 4px !important; margin-left: 4px !important;
            border: 1px solid #d5d9de !important; background: transparent !important; color: #57606a !important;
            border-radius: 4px !important; padding: 3px 8px !important; font-size: 11.5px !important;
            font-family: inherit !important; cursor: pointer !important;
        }
        #tm_search_saveset_btn:hover { border-color: #0073bb !important; color: #0073bb !important; }
        #tm_search_save.tm_saving #tm_search_saveset_btn { display: none !important; }
        #tm_search_save_form { display: none !important; align-items: center !important; gap: 5px !important; }
        #tm_search_save.tm_saving #tm_search_save_btn { display: none !important; }
        #tm_search_save.tm_saving #tm_search_save_form { display: flex !important; }
        #tm_search_save_name {
            height: 26px !important;
            width: 150px !important;
            box-sizing: border-box !important;
            padding: 0 7px !important;
            border: 1px solid #0073bb !important;
            border-radius: 4px !important;
            font-size: 12px !important;
            font-family: inherit !important;
        }
        #tm_search_save_go {
            border: none !important;
            background: #0073bb !important;
            color: #fff !important;
            border-radius: 4px !important;
            padding: 4px 10px !important;
            font-size: 11.5px !important;
            font-family: inherit !important;
            cursor: pointer !important;
        }
        body.tm_theme_dark #tm_search_save_btn,
        body.tm_theme_dark #tm_search_saveset_btn { border-color: #55606e !important; color: #adb5bd !important; }
        body.tm_theme_dark #tm_search_save_name { background: #3a4453 !important; color: #e9ecef !important; }
        body.tm_theme_dark #tm_search_container:focus-within #tm_search_foot.tm_foot_on { border-top-color: #3a4148 !important; }
        .tm_suggest_chips { display: flex !important; flex-wrap: wrap !important; gap: 5px !important; }
        .tm_suggest_chip {
            border: 1px solid #d5d9de !important;
            background: #f6f8fa !important;
            color: #24292f !important;
            border-radius: 999px !important;
            padding: 2px 9px !important;
            font-size: 12px !important;
            line-height: 1.5 !important;
            cursor: pointer !important;
            font-family: inherit !important;
        }
        .tm_suggest_chip:hover { border-color: #0073bb !important; color: #0073bb !important; }
        /* Keyboard highlight (Alt/Option+\u2191\u2193) \u2014 a filled chip so it reads even
           among the row of outline chips. */
        .tm_suggest_chip.tm_suggest_active {
            background: #0073bb !important;
            border-color: #0073bb !important;
            color: #fff !important;
        }
        .tm_suggest_none { font-size: 12px !important; color: #8a9099 !important; }
        .tm_suggest_legend { font-size: 11px !important; color: #8a9099 !important; margin-top: 8px !important; }
        .tm_suggest_legend b { color: #57606a !important; font-weight: 600 !important; }
        .tm_suggest_keys { font-size: 11px !important; color: #99a0a8 !important; margin-top: 4px !important; }
        body.tm_theme_dark #tm_search_container:focus-within #tm_search_pop { background: #2d3542 !important; border-color: #55606e !important; }
        body.tm_theme_dark .tm_suggest_chip { background: #3a4453 !important; border-color: #55606e !important; color: #e9ecef !important; }
        body.tm_theme_dark .tm_suggest_chip.tm_suggest_active { background: #0073bb !important; border-color: #0073bb !important; color: #fff !important; }
        body.tm_theme_dark .tm_suggest_none,
        body.tm_theme_dark .tm_suggest_legend { color: #8a94a0 !important; }
        body.tm_theme_dark .tm_suggest_legend b { color: #adb5bd !important; }
        body.tm_theme_dark .tm_suggest_keys { color: #7d858f !important; }
        body.tm_theme_dark #tm_search_container:focus-within #tm_search_matchcount:not(:empty) { color: #4aa3e0 !important; }

        #tm_actions_container {
            position: fixed !important;
            top: 20px !important;
            /* Width is fixed so the hidden offset is predictable \u2014 the
               container's natural width follows the longest button label
               and was leaving ~80px of body sticking out at -120px. */
            width: 236px !important;
            right: -236px !important;
            box-sizing: border-box !important;
            z-index: 1000 !important;
            transition: right 0.3s ease !important;
            background: rgba(255, 255, 255, 0.95) !important;
            border-radius: 8px 0 0 8px !important;
            padding: 10px 12px !important;
            border: 1px solid #e1e4e8 !important;
            border-right: none !important;
            box-shadow: -2px 2px 8px rgba(0,0,0,0.1) !important;
        }

        /* Inner scroller so a long menu can't clip off-screen. Kept separate
           from the container so the container's ::before pull-tab (which sits
           outside its left edge) isn't clipped by the overflow. */
        #tm_actions_scroll {
            display: flex !important;
            flex-direction: column !important;
            gap: 8px !important;
            max-height: calc(100vh - 48px) !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
        }

        /* Section labels grouping the menu (View / Configure / Data / Help). */
        .tm_menu_header {
            font-size: 11px !important;
            color: #8a9099 !important;
            text-align: left !important;
            margin: 5px 2px 0 !important;
            padding-top: 6px !important;
            border-top: 1px solid #ededed !important;
        }
        #tm_actions_scroll .tm_menu_header:first-child {
            margin-top: 0 !important;
            padding-top: 0 !important;
            border-top: none !important;
        }
        body.tm_theme_dark .tm_menu_header {
            color: #a0aec0 !important;
            border-top-color: #4a5568 !important;
        }

        #tm_actions_container::before {
            content: "..." !important;
            position: absolute !important;
            left: -24px !important;
            top: var(--tm-handle-top, 50%) !important;
            transform: translateY(-50%) !important;
            background: rgba(255, 255, 255, 0.95) !important;
            border: 1px solid #e1e4e8 !important;
            border-right: none !important;
            border-radius: 6px 0 0 6px !important;
            padding: 8px 6px !important;
            font-size: 14px !important;
            color: #6c757d !important;
            cursor: pointer !important;
            transition: all 0.3s ease !important;
        }

        #tm_actions_container:hover {
            right: 0px !important;
        }

        #tm_actions_container:hover::before {
            left: -30px !important;
            background: rgba(0, 115, 187, 0.95) !important;
            color: white !important;
            border-color: #0073bb !important;
        }

        .tm_action_button {
            padding: 6px 12px !important;
            border: 1px solid #ccc !important;
            border-radius: 4px !important;
            background: #fff !important;
            text-decoration: none !important;
            color: #16191f !important;
            font-size: 13px !important;
            text-align: center !important;
            transition: all 0.2s ease !important;
            min-width: 100px !important;
            white-space: nowrap !important;
        }

        /* No translateX on hover: the inner scroller is overflow-x: hidden, so a
           leftward nudge clipped the hovered button's left edge. */
        .tm_action_button:hover {
            background: #f8f9fa !important;
        }

        body.tm_theme_dark #tm_actions_container {
            background: rgba(45, 55, 72, 0.95) !important;
            border-color: #4a5568 !important;
        }

        body.tm_theme_dark #tm_actions_container::before {
            background: rgba(45, 55, 72, 0.95) !important;
            border-color: #4a5568 !important;
            color: #a0aec0 !important;
        }

        body.tm_theme_dark #tm_actions_container:hover::before {
            background: rgba(49, 130, 206, 0.95) !important;
            border-color: #3182ce !important;
            color: white !important;
        }

        img[id^="image"] {
            display: none !important;
        }

        .expandable-container,
        .saml-account-name {
            display: none !important;
        }

        hr {
            display: none !important;
        }

        .saml-account {
            padding: 0 !important;
            border: none !important;
            margin: 0 !important;
        }

        .saml-role input[type="radio"] {
            position: absolute !important;
            left: -9999px !important;
            opacity: 0 !important;
            pointer-events: none !important;
        }

        .saml-role label,
        .saml-role .saml-role-description {
            display: none !important;
        }

        .saml-role {
            background-color: #fff !important;
            border: 1px solid #e1e4e8 !important;
            border-radius: 6px !important;
            padding: 8px 12px !important;
            margin-bottom: 6px !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
            box-shadow: 0 1px 2px rgba(0,0,0,0.08) !important;
            display: grid !important;
            /* fav | account name | tags | role name | account id | service | region | sign in
               The two name columns flex (1fr) so long names get room and ellipsis;
               the fixed tag column keeps every tag chip aligned in one vertical strip. */
            grid-template-columns: auto minmax(0, 1fr) 56px minmax(0, 1fr) auto auto auto auto !important;
            align-items: center !important;
            column-gap: 12px !important;
            transition: all 0.2s ease !important;
            min-height: 36px !important;
        }

        .saml-role[style*="display: none"] {
            display: none !important;
        }

        .saml-role:hover {
            box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
            border-color: #0073bb !important;
        }

        /* Jump-history rows mirror the main role list: a \u2605 favourite/pin toggle
           FIRST, then the click-to-rejump body, then a \u2715 delete. Pinned rows
           (gold \u2605) sort to the top \u2014 no "Pinned" header, the star says it \u2014 and
           can be dragged to reorder; recent rows (outline \u2606, revealed on hover)
           follow. The list scrolls past a cap so the popover can't run off-screen. */
        #tm_jump_recents {
            max-height: 220px !important;
            overflow-y: auto !important;
            margin-top: 8px !important;
        }
        .tm_jump_recent {
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
            padding: 6px 4px !important;
            border-top: 1px solid #eee !important;
            font-size: 12px !important;
            cursor: pointer !important;
            transition: background-color 0.12s ease !important;
        }
        .tm_jump_recent:hover {
            background-color: #eef5fc !important;
        }
        .tm_jump_recent_body {
            flex: 1 1 auto !important;
            min-width: 0 !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 2px !important;
        }
        .tm_jump_recent_l1 {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            gap: 8px !important;
        }
        .tm_jump_recent_lbl {
            color: #16191f !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
        }
        .tm_jump_recent_acct {
            color: #6c757d !important;
            font-family: monospace !important;
            flex: none !important;
        }
        .tm_jump_recent_meta {
            color: #8a9099 !important;
            font-size: 11px !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
        }
        .tm_jump_action {
            flex: none !important;
            width: 20px !important;
            height: 20px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            border-radius: 4px !important;
            cursor: pointer !important;
            font-size: 14px !important;
            line-height: 1 !important;
            opacity: 0 !important;
            transition: opacity 0.12s ease, background-color 0.12s ease, color 0.12s ease !important;
        }
        .tm_jump_recent:hover .tm_jump_action {
            opacity: 1 !important;
        }
        .tm_jump_del { color: #8a9199 !important; }
        .tm_jump_del:hover { color: #c0392b !important; background-color: #fbeae8 !important; }
        /* Armed (first \u2715 click): red-filled "click again to remove". opacity:1
           overrides the hover-reveal so it stays put after the pointer leaves. */
        .tm_jump_del.tm_confirm_del {
            opacity: 1 !important;
            color: #fff !important;
            background-color: #c0392b !important;
        }

        .saml-role.tm_kb_selected {
            outline: 2px solid #0073bb !important;
            outline-offset: -2px !important;
            box-shadow: 0 2px 12px rgba(0,115,187,0.35) !important;
        }

        /* The result list is a flex column, so the space between rows is a
           single container gap \u2014 exactly like the filter columns \u2014 instead of
           per-row margins. Per-row margins collapse with AWS's own row margins,
           which is why shrinking them in compact had no visible effect. */
        #tm_role_list {
            display: flex !important;
            flex-direction: column !important;
            gap: 8px !important;
            margin-top: 12px !important;
        }
        body.tm_compact_mode #tm_role_list {
            gap: 2px !important;
            margin-top: 6px !important;
        }
        #tm_role_list .saml-role {
            margin: 0 !important;
        }

        /* Drag-and-drop reorder.
           Driven by pointer events: dragged row follows cursor via translateY,
           siblings shift out of the way with a smooth CSS transition. */
        #tm_role_list .saml-role {
            cursor: grab !important;
            transition: transform 240ms cubic-bezier(0.22, 0.61, 0.36, 1),
                        opacity 200ms ease,
                        box-shadow 180ms ease !important;
            touch-action: none;
            will-change: transform;
        }
        /* When any filter or search is active, drag-to-reorder is disabled
           (would only affect visible rows). Show the default cursor as a hint. */
        body.tm_filters_active #tm_role_list .saml-role {
            cursor: default !important;
        }
        .saml-role.tm_dragging {
            cursor: grabbing !important;
            /* transition is controlled inline via setProperty(...,"important")
               so we can guarantee it wins over base .saml-role rules. */
            opacity: 0.96 !important;
            box-shadow: 0 18px 38px rgba(0,0,0,0.30),
                        0 0 0 2px rgba(0,115,187,0.65) !important;
            z-index: 100 !important;
            position: relative !important;
            background: #ffffff !important;
            transform-origin: center center !important;
        }
        body.tm_theme_dark .saml-role.tm_dragging {
            background: #2d3748 !important;
        }
        /* Slight dim on the other rows so the dragged one really pops. */
        body.tm_role_dragging_active #tm_role_list .saml-role:not(.tm_dragging) {
            opacity: 0.88 !important;
        }
        /* The action controls keep their clickable cursor. */
        .saml-role .tm_role_buttons,
        .saml-role .tm_role_buttons * { cursor: default !important; }
        .saml-role .tm_role_buttons button,
        .saml-role .tm_role_buttons select { cursor: pointer !important; }

        .saml-role:last-child {
            margin-bottom: 0 !important;
        }

        /* \u2933 jump rows: standard row anatomy, reached by chaining. The name
           cell grows a second "via <profile> hub" line, so it needs a column
           wrapper that takes over .tm_account_name's flex slot. */
        .tm_jump_namewrap {
            display: flex !important;
            flex-direction: column !important;
            gap: 1px !important;
            flex: 0 1 auto !important;
            min-width: 0 !important;
            overflow: hidden !important;
        }
        .tm_jump_namewrap .tm_account_name { flex: none !important; }
        .tm_jump_via {
            font-size: 10.5px !important;
            color: #8a9099 !important;
            font-weight: 400 !important;
            line-height: 1.3 !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
        }
        body.tm_theme_dark .tm_jump_via { color: #8f98a3 !important; }
        /* Hub role missing from today's assertion: visible but inert. */
        .saml-role.tm_jump_unavailable { opacity: 0.55 !important; }
        .saml-role.tm_jump_unavailable .tm_signin_button {
            background: #fff !important;
            border: 1px solid #ccc !important;
            color: #8a9199 !important;
            cursor: not-allowed !important;
        }
        body.tm_theme_dark .saml-role.tm_jump_unavailable .tm_signin_button {
            background: #2a2f36 !important;
            border-color: #3a4148 !important;
        }
        body.tm_theme_dark #tm_jump_save_wrap { color: #adb5bd !important; }

        /* Jump Destinations dialog \u2014 one grid, no modes: name and session
           label are flat inputs that save on blur (they read as text until
           hovered), service/region selects save on change, and the last line
           is the add row. */
        .tm_jdg_row {
            display: grid !important;
            grid-template-columns: minmax(130px, 1fr) 112px minmax(84px, 0.6fr) 130px 156px minmax(100px, 0.8fr) 48px !important;
            gap: 10px !important; align-items: center !important;
            padding: 7px 6px !important; border-top: 1px solid #f0f2f4 !important;
        }
        .tm_jdg_head {
            border-top: 0 !important; padding-bottom: 4px !important;
            font-size: 11px !important; color: #8a9199 !important;
            letter-spacing: 0.02em !important; text-transform: uppercase !important;
        }
        .tm_jdg_acct { font-family: monospace !important; font-size: 12px !important; color: #6c757d !important; }
        .tm_jdg_profile { font-size: 12.5px !important; color: #545b64 !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; }
        .tm_jd_service, .tm_jd_region {
            padding: 5px 6px !important; border: 1px solid #ccc !important; border-radius: 4px !important;
            font-size: 12px !important; background: #fff !important; color: #16191f !important;
            width: 100% !important; box-sizing: border-box !important;
        }
        .tm_jd_flat {
            border: 1px solid transparent !important; background: transparent !important;
            border-radius: 4px !important; padding: 5px 6px !important; font-size: 12.5px !important;
            color: #16191f !important; width: 100% !important; box-sizing: border-box !important;
        }
        .tm_jd_flat:hover { border-color: #dfe2e5 !important; background: #fff !important; }
        .tm_jd_flat:focus {
            border-color: #0073bb !important; background: #fff !important;
            outline: none !important; box-shadow: 0 0 0 2px rgba(0, 115, 187, 0.12) !important;
        }
        .tm_jdg_actions { display: flex !important; justify-content: flex-end !important; }
        .tm_jd_del {
            width: 24px !important; height: 24px !important; border: none !important; background: transparent !important;
            border-radius: 4px !important; cursor: pointer !important; font-size: 13px !important; line-height: 1 !important;
            color: #8a9199 !important; padding: 0 !important;
        }
        .tm_jd_del:hover { background: #fbeae8 !important; color: #c0392b !important; }
        .tm_jd_del.tm_confirm_del { background: #c0392b !important; color: #fff !important; }
        .tm_jdg_add { background: #f7fafd !important; border-radius: 6px !important; border-top-color: transparent !important; margin-top: 4px !important; }
        .tm_jdg_add .tm_jd_addcell {
            border: 1px solid #ccc !important; background: #fff !important; border-radius: 4px !important;
            padding: 5px 6px !important; font-size: 12.5px !important; width: 100% !important; box-sizing: border-box !important;
        }
        .tm_jdg_acct_input { font-family: monospace !important; }
        #tm_jd_add_btn {
            padding: 6px 12px !important; border: 1px solid #0073bb !important; background: #0073bb !important;
            color: #fff !important; border-radius: 4px !important; font-size: 12px !important; cursor: pointer !important;
        }
        #tm_jd_add_err { color: #c0392b !important; font-size: 12px !important; margin-top: 6px !important; min-height: 14px !important; }
        .tm_jd_empty { padding: 10px 6px !important; font-size: 13px !important; color: #8a9199 !important; }

        /* Env color is painted as a left-stripe inline (via applyEnvironmentStyling)
           so the colour comes from the user's Environments config, not
           hardcoded CSS. */
        .saml-role[data-env-id]:hover {
            box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
        }

        /* Flatten this wrapper so its children (fav, account name, role name)
           become direct grid items of .saml-role and share its columns. */
        .tm_role_info {
            display: contents !important;
        }

        .tm_account_name {
            font-size: 14px !important;
            color: #16191f !important;
            font-weight: 500 !important;
            margin: 0 !important;
            flex: 0 1 auto !important;
            min-width: 0 !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
            position: relative !important;
            cursor: default !important;
        }

        .tm_account_id {
            font-size: 12px !important;
            color: #16191f !important;
            font-weight: 500 !important;
            margin: 0 !important;
            font-family: monospace !important;
            background: #fff !important;
            border: 1px solid #ccc !important;
            padding: 6px 10px !important;
            border-radius: 4px !important;
            cursor: pointer !important;
            min-width: 116px !important;
            text-align: center !important;
            box-sizing: border-box !important;
            transition: all 0.2s ease !important;
        }

        .tm_account_id:hover {
            border-color: #0073bb !important;
            background: #f8f9fa !important;
        }

        .tm_role_name {
            font-size: 14px !important;
            color: #16191f !important;
            font-weight: 500 !important;
            margin: 0 !important;
            flex: 0 1 auto !important;
            min-width: 0 !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
        }

        /* Account tags: on-demand chip in the name cell + an expandable inline
           editor that spans the whole row (grid-column: 1 / -1). */
        .tm_tag_cell {
            display: flex !important;
            align-items: center !important;
            justify-content: flex-start !important;
            min-width: 0 !important;
        }
        .tm_tag_chip {
            flex: none !important;
            display: inline-flex !important;
            align-items: center !important;
            gap: 3px !important;
            border: 1px solid #d5d9de !important;
            background: #fff !important;
            color: #6c757d !important;
            border-radius: 999px !important;
            padding: 0 7px !important;
            height: 18px !important;
            font-size: 11px !important;
            line-height: 1 !important;
            cursor: pointer !important;
            white-space: nowrap !important;
            box-sizing: border-box !important;
        }
        .tm_tag_chip.tm_no_tags { border-style: dashed !important; color: #aab1b8 !important; }
        .tm_tag_chip:hover { border-color: #0073bb !important; color: #0073bb !important; }
        .tm_tag_chip.tm_tag_matched {
            border-color: #0073bb !important;
            color: #0073bb !important;
            background: #e6f1fb !important;
        }
        body.tm_theme_dark .tm_tag_chip.tm_tag_matched {
            border-color: #3182ce !important;
            color: #cfe4fb !important;
            background: #24405c !important;
        }
        .tm_tag_ico { display: block !important; }
        .tm_tag_plus { font-weight: 700 !important; }
        .tm_tag_editor {
            grid-column: 1 / -1 !important;
            display: none !important;
            flex-wrap: wrap !important;
            align-items: center !important;
            gap: 6px !important;
            margin-top: 8px !important;
            padding-top: 8px !important;
            border-top: 1px solid #eef0f2 !important;
        }
        .saml-role.tm_tags_open .tm_tag_editor { display: flex !important; }
        .tm_tag_pills { display: flex !important; flex-wrap: wrap !important; gap: 6px !important; }
        .tm_tag_addwrap { display: inline-flex !important; }
        .tm_tag_pill {
            display: inline-flex !important;
            align-items: center !important;
            gap: 4px !important;
            border: 1px solid #d5d9de !important;
            background: #f6f8fa !important;
            color: #444 !important;
            border-radius: 999px !important;
            padding: 2px 4px 2px 10px !important;
            font-size: 12px !important;
        }
        .tm_tag_del {
            border: none !important;
            background: transparent !important;
            color: #adb5bd !important;
            cursor: pointer !important;
            font-size: 11px !important;
            line-height: 1 !important;
            padding: 0 3px !important;
        }
        .tm_tag_del:hover { color: #c0392b !important; }
        .tm_tag_add {
            border: 1px dashed #c7ccd1 !important;
            background: transparent !important;
            color: #6c757d !important;
            border-radius: 999px !important;
            padding: 2px 10px !important;
            font-size: 12px !important;
            cursor: pointer !important;
        }
        .tm_tag_add:hover { border-color: #0073bb !important; color: #0073bb !important; }
        .tm_tag_input {
            border: 1px solid #0073bb !important;
            border-radius: 999px !important;
            padding: 2px 10px !important;
            font-size: 12px !important;
            line-height: 1.4 !important;
            min-width: 130px !important;
            outline: none !important;
            background: #fff !important;
            color: #16191f !important;
        }
        /* The native datalist \u25BC sits misaligned inside the pill-shaped input and
           inflates its height; hide it. Autocomplete still works on type / \u2193. */
        .tm_tag_input::-webkit-calendar-picker-indicator { display: none !important; }
        body.tm_theme_dark .tm_tag_chip { background: #3a4453 !important; border-color: #55606e !important; color: #c7ccd1 !important; }
        body.tm_theme_dark .tm_tag_chip.tm_no_tags { color: #8a94a0 !important; }
        body.tm_theme_dark .tm_tag_pill { background: #3a4453 !important; border-color: #55606e !important; color: #e9ecef !important; }
        body.tm_theme_dark .tm_tag_editor { border-top-color: #3a4453 !important; }
        body.tm_theme_dark .tm_tag_add { border-color: #55606e !important; color: #adb5bd !important; }
        body.tm_theme_dark .tm_tag_input { background: #2d3542 !important; color: #e9ecef !important; }
        /* Armed (first \u2715 click) tag pill \u2014 red "click again to remove", matching
           the shortcut chips (whole chip reddens, \u2715 becomes white-on-red). */
        .tm_tag_pill.tm_confirm_del {
            border-color: #c0392b !important;
            background-color: #fbeae8 !important;
            color: #c0392b !important;
        }
        .tm_tag_pill.tm_confirm_del .tm_tag_del {
            color: #fff !important;
            background-color: #c0392b !important;
            border-radius: 999px !important;
        }
        body.tm_theme_dark .tm_tag_pill.tm_confirm_del {
            border-color: #e06060 !important;
            background-color: #4a2222 !important;
            color: #f0a0a0 !important;
        }
        body.tm_theme_dark .tm_tag_pill.tm_confirm_del .tm_tag_del {
            color: #4a2222 !important;
            background-color: #f0a0a0 !important;
        }

        /* Start View modal \u2014 every choice is one pick chip, grouped by a right-
           aligned label (Views / Shortcuts / Tags), mirroring the main filter
           panel. The active start view is highlighted with a \u2713. The modal card
           is always white, so no dark-theme variants are needed. */
        .tm_sv_grid {
            display: grid !important;
            grid-template-columns: auto 1fr !important;
            gap: 11px 12px !important;
            align-items: baseline !important;
            margin: 2px 0 18px 0 !important;
        }
        .tm_sv_rowlabel {
            text-align: right !important;
            color: #6c757d !important;
            font-size: 12px !important;
            white-space: nowrap !important;
        }
        .tm_sv_chips { display: flex !important; flex-wrap: wrap !important; gap: 6px !important; }
        .tm_sv_pick {
            border: 1px solid #d5d9de !important;
            background: #f6f8fa !important;
            color: #24292f !important;
            border-radius: 15px !important;
            padding: 3px 12px !important;
            font-size: 13px !important;
            cursor: pointer !important;
            font-family: inherit !important;
        }
        .tm_sv_pick:hover:not(:disabled) { border-color: #0073bb !important; color: #0073bb !important; }
        .tm_sv_pick:disabled { opacity: 0.5 !important; cursor: not-allowed !important; }
        .tm_sv_pick.tm_sv_active {
            border-color: #0073bb !important;
            background: #e7f2fb !important;
            color: #0073bb !important;
            font-weight: 600 !important;
        }
        .tm_sv_footer {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            border-top: 1px solid #eee !important;
            padding-top: 14px !important;
        }
        .tm_sv_footer_left { display: flex !important; gap: 8px !important; }
        .tm_sv_btn {
            padding: 7px 14px !important;
            border: 1px solid #ccc !important;
            background: white !important;
            color: #16191f !important;
            border-radius: 4px !important;
            cursor: pointer !important;
            font-size: 13px !important;
            font-family: inherit !important;
        }
        .tm_sv_btn:hover:not(:disabled) { border-color: #0073bb !important; color: #0073bb !important; }
        .tm_sv_btn:disabled { opacity: 0.45 !important; cursor: not-allowed !important; }

        body.tm_theme_dark .tm_account_id {
            background-color: #4a5568 !important;
            color: #e9ecef !important;
            border-color: #6b7280 !important;
        }

        body.tm_theme_dark .tm_account_id:hover {
            border-color: #3182ce !important;
            background-color: #5a6678 !important;
        }

        .saml-role span[style*="clear"] {
            display: none !important;
        }

        /* Flatten this wrapper too, so account id / service / region / sign in
           become direct grid items of .saml-role. */
        .tm_role_buttons {
            display: contents !important;
        }

        .tm_role_button {
            padding: 6px 12px !important;
            border: 1px solid #ccc !important;
            border-radius: 4px !important;
            background: #fff !important;
            color: #16191f !important;
            cursor: pointer !important;
            font-size: 13px !important;
            font-weight: 500 !important;
            white-space: nowrap !important;
            text-decoration: none !important;
            transition: all 0.2s ease !important;
        }

        .tm_role_button.primary {
            background: #0073bb !important;
            color: #fff !important;
            border-color: #0073bb !important;
        }

        .tm_role_button:hover {
            background: #f8f9fa !important;
            transform: translateY(-1px) !important;
        }

        .tm_role_button.primary:hover {
            background: #005a94 !important;
        }

        .tm_service_dropdown {
            padding: 6px 12px !important;
            border: 1px solid #ccc !important;
            border-radius: 4px !important;
            background: #fff !important;
            color: #16191f !important;
            cursor: pointer !important;
            font-size: 13px !important;
            font-weight: 500 !important;
            width: 150px !important;
            box-sizing: border-box !important;
            transition: all 0.2s ease !important;
        }

        .tm_service_dropdown:hover {
            border-color: #0073bb !important;
        }

        .tm_service_dropdown:focus {
            outline: none !important;
            border-color: #0073bb !important;
            box-shadow: 0 0 0 2px rgba(0, 115, 187, 0.2) !important;
        }

        body.tm_theme_dark .tm_service_dropdown {
            background-color: #4a5568 !important;
            color: #e9ecef !important;
            border-color: #6b7280 !important;
        }

        body.tm_theme_dark .tm_service_dropdown:hover {
            border-color: #3182ce !important;
        }

        .tm_region_dropdown {
            padding: 6px 12px !important;
            border: 1px solid #ccc !important;
            border-radius: 4px !important;
            background: #fff !important;
            color: #16191f !important;
            cursor: pointer !important;
            font-size: 13px !important;
            font-weight: 500 !important;
            width: 190px !important;
            box-sizing: border-box !important;
            transition: all 0.2s ease !important;
        }
        .tm_region_dropdown:hover { border-color: #0073bb !important; }
        .tm_region_dropdown:focus {
            outline: none !important;
            border-color: #0073bb !important;
            box-shadow: 0 0 0 2px rgba(0, 115, 187, 0.2) !important;
        }
        body.tm_theme_dark .tm_region_dropdown {
            background-color: #4a5568 !important;
            color: #e9ecef !important;
            border-color: #6b7280 !important;
        }
        body.tm_theme_dark .tm_region_dropdown:hover { border-color: #3182ce !important; }

        .tm_favorite_button {
            padding: 4px 8px !important;
            border: 1px solid #ffc107 !important;
            border-radius: 4px !important;
            background: #fff !important;
            color: #ffc107 !important;
            cursor: pointer !important;
            font-size: 16px !important;
            font-weight: normal !important;
            transition: all 0.2s ease !important;
            min-width: 32px !important;
            text-align: center !important;
            flex-shrink: 0 !important;
        }

        .tm_favorite_button:hover {
            background: #fff3cd !important;
            transform: scale(1.1) !important;
        }

        .tm_favorite_button.favorited {
            background: #ffc107 !important;
            color: #fff !important;
            border-color: #ffc107 !important;
        }

        .tm_favorite_button.favorited:hover {
            background: #e0a800 !important;
            border-color: #d39e00 !important;
        }

        .tm_toast {
            position: fixed !important;
            bottom: 40px !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            padding: 10px 20px !important;
            border-radius: 4px !important;
            color: #fff !important;
            z-index: 10000 !important;
            font-size: 14px !important;
        }

        .tm_toast.success { background-color: #28a745 !important; }
        .tm_toast.error { background-color: #dc3545 !important; }
        .tm_toast.info { background-color: #17a2b8 !important; }

        /* Tighten AWS's default 20px form margin so the footer doesn't float in
           a large void below the role list. */
        #saml_form {
            margin-bottom: 8px !important;
        }

        #tm_footer {
            text-align: center !important;
            color: #6c757d !important;
            font-size: 12px !important;
            padding: 10px 20px !important;
            background-color: #f8f9fa !important;
            margin-top: 0px !important;
            margin-bottom: 6px !important;
            transition: background-color 0.3s ease !important;
        }

        #tm_footer a {
            color: #0073bb !important;
            text-decoration: none !important;
        }

        body.tm_theme_dark #tm_footer {
            background-color: #2d3748 !important;
            color: #a0aec0 !important;
        }

        body.tm_theme_dark #tm_footer a {
            color: #63b3ed !important;
        }

        /* Keyboard-shortcut keys inside any modal: render as actual key chips
           so they're readable in both themes. The browser default <kbd> style
           is invisible on a white card. */
        [id$="_modal"] kbd {
            display: inline-block !important;
            padding: 1px 6px !important;
            margin: 0 2px !important;
            border: 1px solid #ccc !important;
            border-bottom-width: 2px !important;
            border-radius: 4px !important;
            background: #f6f8fa !important;
            color: #24292e !important;
            font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace !important;
            font-size: 12px !important;
            line-height: 1.2 !important;
        }
        body.tm_theme_dark [id$="_modal"] kbd {
            border-color: #4a5568 !important;
            background: #1a202c !important;
            color: #cbd5e0 !important;
        }

        /* Inputs / textareas / selects inside any modal: in dark mode use a
           dark surface and light text. Inline background:white styles on
           inputs/textareas are caught separately by the modal MutationObserver
           remap; this rule handles the much commoner case where the element
           has no inline background/color (so the CSS isn't fighting
           !important shorthand) and yet still needs a dark surface. */
        body.tm_theme_dark [id$="_modal"] input[type="text"],
        body.tm_theme_dark [id$="_modal"] input[type="search"],
        body.tm_theme_dark [id$="_modal"] input[type="number"],
        body.tm_theme_dark [id$="_modal"] input[type="email"],
        body.tm_theme_dark [id$="_modal"] input[type="url"],
        body.tm_theme_dark [id$="_modal"] textarea,
        body.tm_theme_dark [id$="_modal"] select {
            background-color: #1a202c !important;
            color: #e9ecef !important;
            border-color: #4a5568 !important;
        }
        body.tm_theme_dark [id$="_modal"] input::placeholder,
        body.tm_theme_dark [id$="_modal"] textarea::placeholder {
            color: #718096 !important;
        }

        /* Compact mode tightens the vertical rhythm without shrinking the rows
           themselves: the panel's own padding, the gap between filter rows, and
           the gap between result rows. Each result row keeps its full internal
           padding, height and control sizes \u2014 only the space BETWEEN rows
           shrinks \u2014 so nothing ever looks cramped. */
        body.tm_compact_mode #tm_interface_wrapper {
            padding: 8px !important;
        }

        body.tm_compact_mode .tm_left_column,
        body.tm_compact_mode .tm_right_column,
        body.tm_compact_mode #tm_jump_section {
            gap: 5px !important;
        }

        body.tm_compact_mode .tm_frow_shortcuts {
            padding-top: 5px !important;
        }

        /* The result-row gap is a flex gap on #tm_role_list; compact shrinks
           it there (8px to 2px) \u2014 see the #tm_role_list rules above. Rows keep
           their full padding/height/controls, so nothing looks cramped. */

        #smallprint {
            background-color: #f8f9fa !important;
            border-top: 1px solid #e7e7e7 !important;
            padding: 8px 20px !important;
            margin-top: 0px !important;
            transition: background-color 0.3s ease, border-color 0.3s ease !important;
        }

        body.tm_theme_dark #smallprint {
            background-color: #2d3748 !important;
            border-color: #4a5568 !important;
            color: #e9ecef !important;
        }

        .language-dropdown {
            display: none !important;
        }

        #smallprint .textinput {
            font-size: 12px !important;
            color: #6c757d !important;
            line-height: 1.4 !important;
            margin: 0 !important;
            text-align: center !important;
        }

        body.tm_theme_dark #smallprint .textinput {
            color: #a0aec0 !important;
        }

        #smallprint .termsandprivacy {
            color: #0073bb !important;
            text-decoration: none !important;
            font-size: 12px !important;
            margin: 0 8px !important;
            display: inline !important;
        }

        #smallprint .termsandprivacy:hover {
            text-decoration: underline !important;
        }

        body.tm_theme_dark #smallprint .termsandprivacy {
            color: #63b3ed !important;
        }

        #smallprint .textinput br {
            line-height: 1.2 !important;
        }
    `,fr=`
        .tm_sets_column {
            flex: 0 0 250px !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 6px !important;
            padding: 0 15px !important;
            min-width: 0 !important;
        }
        .tm_sets_head {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            min-height: 25px !important;
        }
        .tm_sets_head .tm_frow_label { width: auto !important; text-align: left !important; }
        .tm_sets_new_wrap { position: relative !important; }
        #tm_sets_new {
            border: 0 !important; background: transparent !important; color: #0073bb !important;
            font-size: 12.5px !important; cursor: pointer !important; padding: 2px 0 !important; font-family: inherit !important;
        }
        #tm_sets_new:hover { text-decoration: underline !important; }
        #tm_sets_menu {
            position: absolute !important; right: 0 !important; top: calc(100% + 4px) !important; z-index: 10000 !important;
            min-width: 190px !important; background: white !important; border: 1px solid #ccc !important;
            border-radius: 6px !important; box-shadow: 0 8px 24px rgba(0,0,0,0.16) !important; padding: 4px 0 !important;
        }
        #tm_sets_menu a {
            display: block !important; padding: 7px 12px !important; color: #16191f !important;
            text-decoration: none !important; font-size: 13px !important; white-space: nowrap !important;
        }
        #tm_sets_menu a:hover { background: #f1f3f5 !important; }
        #tm_sets_list { display: flex !important; flex-direction: column !important; gap: 6px !important; }
        .tm_sets_empty { color: #6c757d !important; font-size: 12.5px !important; line-height: 1.45 !important; }
        .tm_set_line { display: flex !important; align-items: center !important; gap: 6px !important; }
        .tm_set_chip {
            flex: 1 1 auto !important; min-width: 0 !important;
            display: flex !important; align-items: center !important; justify-content: space-between !important; gap: 8px !important;
            padding: 3px 11px !important; border: 1px solid #adb5bd !important; border-radius: 15px !important;
            color: #16191f !important; background: #fff !important; text-decoration: none !important;
            font-size: 13px !important; cursor: pointer !important; transition: all 0.2s ease !important;
        }
        .tm_set_chip:hover { background: #e9ecef !important; }
        .tm_set_chip.active { background: #0073bb !important; border-color: #0073bb !important; color: #fff !important; }
        .tm_set_name { overflow: hidden !important; text-overflow: ellipsis !important; white-space: nowrap !important; }
        .tm_set_count { flex: none !important; font-size: 11.5px !important; color: #6c757d !important; }
        .tm_set_chip.active .tm_set_count { color: #cfe3f3 !important; }
        .tm_set_open {
            flex: none !important; border: 1px solid #0073bb !important; background: #fff !important; color: #0073bb !important;
            border-radius: 4px !important; font-size: 12px !important; font-weight: 600 !important; padding: 3px 9px !important;
            cursor: pointer !important; white-space: nowrap !important; font-family: inherit !important;
        }
        .tm_set_open:hover { background: #e7f2fb !important; }
        .tm_set_open.tm_set_open_primary { background: #0073bb !important; color: #fff !important; padding: 6px 14px !important; font-size: 13px !important; }
        .tm_set_open:disabled { opacity: 0.45 !important; cursor: not-allowed !important; }
        #tm_sets_more { font-size: 12.5px !important; color: #0073bb !important; text-decoration: none !important; }

        #tm_set_bar {
            display: flex !important; align-items: center !important; flex-wrap: wrap !important; gap: 8px 14px !important;
            background: #eef6fc !important; border: 1px solid #b3d6ee !important; border-radius: 6px !important;
            padding: 9px 16px !important; margin: 0 0 10px 0 !important; font-size: 13px !important; color: #16191f !important;
        }
        .tm_set_bar_sub { color: #4a5568 !important; }
        .tm_set_bar_warn { color: #b02a37 !important; }
        .tm_set_bar_spacer { flex: 1 !important; }
        #tm_set_bar a { color: #0073bb !important; font-size: 13px !important; }
        .tm_role_name[data-set-hint] { overflow: visible !important; white-space: normal !important; line-height: 1.25 !important; }
        .tm_role_name[data-set-hint]::after {
            content: attr(data-set-hint);
            display: block; font-size: 11px; color: #0073bb; font-weight: 400;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        .tm_set_modal_foot {
            display: flex !important; justify-content: space-between !important; align-items: center !important;
            gap: 8px !important; margin-top: 16px !important;
        }
        .tm_set_primary { background: #0073bb !important; border-color: #0073bb !important; color: #fff !important; font-weight: 600 !important; }
        .tm_set_primary:hover:not(:disabled) { color: #fff !important; background: #005f9e !important; }
        .tm_set_delete { color: #dc3545 !important; }
        .tm_set_delete.tm_set_delete_armed { background: #dc3545 !important; border-color: #dc3545 !important; color: #fff !important; }
        .tm_set_fields { display: flex !important; gap: 14px !important; flex-wrap: wrap !important; margin-bottom: 14px !important; }
        .tm_set_fields label {
            display: flex !important; flex-direction: column !important; gap: 4px !important; flex: 1 1 200px !important;
            font-size: 11px !important; text-transform: uppercase !important; letter-spacing: 0.04em !important; color: #6c757d !important;
        }
        .tm_set_fields input {
            border: 1px solid #ccc !important; border-radius: 4px !important; padding: 6px 9px !important;
            font-size: 13.5px !important; text-transform: none !important; letter-spacing: normal !important;
            color: #16191f !important; font-family: inherit !important;
        }
        .tm_set_list_head { display: flex !important; justify-content: space-between !important; font-size: 12.5px !important; color: #6c757d !important; margin-bottom: 6px !important; }
        .tm_set_list_head a { color: #0073bb !important; }
        .tm_set_picklist { border: 1px solid #e1e4e8 !important; border-radius: 5px !important; max-height: 46vh !important; overflow-y: auto !important; }
        .tm_set_pick {
            display: grid !important; grid-template-columns: 18px 1fr auto !important; gap: 10px !important; align-items: center !important;
            padding: 7px 10px !important; font-size: 13px !important; cursor: pointer !important;
        }
        .tm_set_pick + .tm_set_pick { border-top: 1px solid #f1f3f5 !important; }
        .tm_set_pick_where { color: #6c757d !important; font-size: 12px !important; text-align: right !important; min-width: 0 !important; }
        .tm_set_pick_where small {
            display: block !important; max-width: 300px !important; overflow: hidden !important; text-overflow: ellipsis !important;
            white-space: nowrap !important; color: #adb5bd !important; font-size: 11px !important;
        }
        .tm_set_pick_off { color: #adb5bd !important; cursor: default !important; }
        .tm_set_tabwho { display: flex !important; align-items: center !important; gap: 8px !important; min-width: 0 !important; }
        .tm_set_dot { flex: none !important; width: 10px !important; height: 10px !important; border-radius: 3px !important; }
        .tm_set_tabsec + .tm_set_tabsec { border-top: 1px solid #e1e4e8 !important; }
        .tm_set_tabsec_head {
            display: flex !important; justify-content: space-between !important; padding: 8px 10px 2px !important;
            font-size: 11px !important; font-weight: 700 !important; text-transform: uppercase !important;
            letter-spacing: 0.04em !important; color: #1a73e8 !important;
        }
        .tm_set_tabsec_head a { color: #0073bb !important; text-transform: none !important; letter-spacing: normal !important; font-weight: 400 !important; font-size: 12px !important; }
        .tm_set_reopen { display: flex !important; flex-wrap: wrap !important; gap: 14px !important; align-items: center !important; margin-top: 12px !important; font-size: 13px !important; }
        .tm_set_reopen > span { color: #6c757d !important; }
        .tm_set_reopen label { display: inline-flex !important; gap: 5px !important; align-items: center !important; cursor: pointer !important; }

        .tm_set_grid {
            display: grid !important; grid-template-columns: 6px minmax(160px, 1.4fr) 170px 180px minmax(100px, 1fr) 26px !important;
            gap: 10px !important; align-items: center !important;
        }
        .tm_set_ghead {
            font-size: 11px !important; text-transform: uppercase !important; letter-spacing: 0.04em !important; color: #6c757d !important;
            padding: 0 6px 6px !important; border-bottom: 1px solid #e9ecef !important;
        }
        .tm_set_row { padding: 7px 6px !important; border-top: 1px solid #f1f3f5 !important; }
        .tm_set_row_extra { background: #f3f9fd !important; border-top: 0 !important; }
        .tm_set_stripe { width: 4px !important; height: 28px !important; border-radius: 2px !important; }
        .tm_set_who { font-size: 13px !important; min-width: 0 !important; overflow-wrap: anywhere !important; }
        .tm_set_who small { display: block !important; color: #6c757d !important; font-size: 11.5px !important; }
        .tm_set_same { color: #adb5bd !important; font-size: 12px !important; padding-left: 10px !important; }
        .tm_set_grid select {
            width: 100% !important; border: 1px solid #ccc !important; border-radius: 4px !important; padding: 5px 6px !important;
            font-size: 13px !important; background: #fff !important; color: #16191f !important; font-family: inherit !important;
        }
        .tm_set_page {
            font-size: 12px !important; color: #4a5568 !important; overflow: hidden !important;
            text-overflow: ellipsis !important; white-space: nowrap !important; min-width: 0 !important;
        }
        .tm_set_page_none { color: #adb5bd !important; }
        .tm_set_remove { border: 0 !important; background: transparent !important; color: #adb5bd !important; cursor: pointer !important; font-size: 14px !important; }
        .tm_set_remove:hover { color: #dc3545 !important; }
        .tm_set_addrow { padding: 0 6px 6px !important; }
        .tm_set_addtab { color: #0073bb !important; font-size: 12.5px !important; grid-column: 2 / span 2 !important; }
        .tm_set_addrole { display: flex !important; align-items: center !important; gap: 12px !important; margin-top: 12px !important; }
        .tm_set_addrole_select {
            border: 1px solid #ccc !important; border-radius: 4px !important; padding: 5px 6px !important;
            font-size: 13px !important; background: #fff !important; color: #16191f !important; max-width: 60% !important;
        }
        .tm_set_tabcount { color: #6c757d !important; font-size: 12.5px !important; }
        .tm_set_empty_grid { color: #6c757d !important; padding: 12px 6px !important; }

        body.tm_theme_dark .tm_set_chip { background-color: #4a5568 !important; color: #e9ecef !important; border-color: #6b7280 !important; }
        body.tm_theme_dark .tm_set_chip:hover { background-color: #5a6578 !important; }
        body.tm_theme_dark .tm_set_chip.active { background-color: #3182ce !important; border-color: #3182ce !important; }
        body.tm_theme_dark .tm_set_count { color: #cbd5e0 !important; }
        body.tm_theme_dark .tm_set_open { background: transparent !important; color: #63b3ed !important; border-color: #63b3ed !important; }
        body.tm_theme_dark .tm_set_open.tm_set_open_primary { background: #3182ce !important; color: #fff !important; border-color: #3182ce !important; }
        body.tm_theme_dark .tm_sets_empty { color: #a0aec0 !important; }
        body.tm_theme_dark #tm_sets_menu { background: #2d3748 !important; border-color: #4a5568 !important; }
        body.tm_theme_dark #tm_sets_menu a { color: #e9ecef !important; }
        body.tm_theme_dark #tm_sets_menu a:hover { background: #4a5568 !important; }
        body.tm_theme_dark #tm_set_bar { background: #1f3a52 !important; border-color: #2c5282 !important; color: #e9ecef !important; }
        body.tm_theme_dark .tm_set_bar_sub { color: #cbd5e0 !important; }
        body.tm_theme_dark #tm_set_bar a { color: #63b3ed !important; }
        body.tm_theme_dark .tm_role_name[data-set-hint]::after { color: #90cdf4; }
        body.tm_theme_dark .tm_set_grid select,
        body.tm_theme_dark .tm_set_addrole_select { background: #2d3748 !important; color: #e9ecef !important; border-color: #4a5568 !important; }
        body.tm_theme_dark .tm_set_row { border-top-color: #3a4148 !important; }
        body.tm_theme_dark .tm_set_row_extra { background: #25303d !important; }
        body.tm_theme_dark .tm_set_ghead { border-bottom-color: #3a4148 !important; }
        body.tm_theme_dark .tm_set_picklist { border-color: #4a5568 !important; }
        body.tm_theme_dark .tm_set_pick + .tm_set_pick { border-top-color: #3a4148 !important; }
        body.tm_theme_dark .tm_set_page { color: #cbd5e0 !important; }

        body.tm_compact_mode .tm_sets_column { flex-basis: 220px !important; }
  `,tn=document.createElement("style");tn.textContent=gr+fr,document.head.appendChild(tn),await V.loadCache(),await V.loadLastServicesCache(),await Q.loadCache(),await Q.loadLastRegionsCache(),await Ot.loadCache(),await Z.loadCache(),await _t.loadCache(),await q.loadCache(),await tt.loadCache(),ut=await k.getJumpRecents(),ye=await k.getJumpPinned(),await F.loadCache(),await pt.loadCache(),await ot.loadCache(),await Kt.loadCache(),await X.loadCache(),await $t.loadCache(),await Bt.loadCache(),Jn(),tt.render(),Qo(),i(".saml-role").each(function(){let t=i(this),e=t.find('input[type="radio"]'),o=t.find("label, .saml-role-description");if(e.length&&o.length){let n=e.val(),a=o.text().trim(),s=t.closest(".saml-account"),l=s.prev().find(".saml-account-name").text().trim()||s.prevAll(".expandable-container").first().find(".saml-account-name").text().trim(),m=Tn(l),h=Ot.nameFor(m.id)||m.name,T=v(h),w=v(m.name),R=v(m.id),x=v(a),y=v(n),d=`
                <div class="tm_role_info">
                    <button type="button" class="tm_favorite_button" data-role-arn="${y}" title="Add to favorites">\u2606</button>
                    <div class="tm_account_name" data-account-id="${R}" data-aws-name="${w}">${T}</div>
                    <div class="tm_tag_cell">${Do(m.id)}</div>
                    <div class="tm_role_name">${x}</div>
                </div>
                <div class="tm_role_buttons">
                    <button type="button" class="tm_account_id" data-account-id="${R}" title="Click to copy account ID">${R}</button>
                    ${V.generateDropdownHTML(n,m.id)}
                    ${Q.generateRegionDropdownHTML(n)}
                    <button type="button" class="tm_role_button primary tm_signin_button" data-role-arn="${y}" title="Sign in \u2014 \u2318/Ctrl-click or middle-click toggles new tab">Sign In</button>
                </div>
                <div class="tm_tag_editor" data-account-id="${R}">${Go(m.id)}</div>
            `;t.append(d)}}),Bt.ensureList(),Bt.applySavedOrder(),i("body").on("click",".tm_account_id",async function(t){t.preventDefault();let e=(this.textContent||"").trim();if(!e)return;let o=await $o(e);S(o?`Account ID ${e} copied!`:`Failed to copy ${e}`,o?"success":"error",r.TOAST_DURATION_LONG)}),i("body").on("click auxclick",".tm_signin_button",async function(t){if(t.type==="auxclick"&&t.button!==1)return;t.preventDefault();let e=!!(t.metaKey||t.ctrlKey||t.type==="auxclick"&&t.button===1),o=Qt!==e,n=i(this),a=n.data("role-arn"),s=n.closest(".saml-role");if(n.attr("data-jump")==="1"){if(s.hasClass("tm_jump_unavailable")){S("This jump's hub role isn't in today's role list, so there is nothing to chain from.","error",r.TOAST_DURATION_LONG);return}let d=s.attr("data-dest-account")||"",g=s.attr("data-dest-profile")||"",O=q.find(d,g),N=String(s.find(".tm_region_dropdown").val()||""),M=String(s.find(".tm_service_dropdown").val()||"");ro(g,d,O&&O.label||"",{region:N,service:M,fromRow:!0});return}let l=s.find(".tm_service_dropdown").val(),m=s.find(".tm_region_dropdown").val(),h=s.find(".tm_role_name").text().trim(),T=s.find(".tm_account_name").text().trim(),w=s.find(".tm_account_id").text().trim(),R=Pe(s),x=so(h,T,w);if(x.length>0&&!await sn(T,w,h,x))return;m&&await Q.saveLastRegion(a,m),l?(await V.saveLastService(a,l),S(`Signing in to ${h}${o?" (new tab)":""}\u2026`,"info",2e3)):S(`Signing in to ${h} (console${o?", new tab":""})\u2026`,"info",2e3);let y=Yo({accountName:T,accountId:w,roleName:h,env:R});await $t.recordSignIn(a),y.tok=await Be(),await Ko(w,T,y.envColor,y.envLetter,""),Bo(a,Ye(l,y,m),{newTab:o})}),i("body").on("change",".tm_region_dropdown",async function(){let t=i(this),e=t.val(),o=t.data("role-arn");e&&await Q.saveLastRegion(o,e)}),i("body").on("change",".tm_service_dropdown",async function(){let t=i(this),e=t.val(),o=t.data("role-arn");if(await V.saveLastService(o,e),e){let n=t.find("option:selected").text();S(`${n} selected - click Sign In`,"info",r.TOAST_DURATION_SHORT)}}),i("body").on("click",".tm_favorite_button",async function(t){t.preventDefault();let e=i(this),o=e.data("role-arn"),n=e.closest(".saml-role"),a=n.find(".tm_account_name").text().trim(),s=n.find(".tm_role_name").text().trim();c("Favorite button clicked:",o,a,s),await Zt.toggleFavorite(o,a,s)}),i("body").on("click",".tm_tag_chip",function(t){t.preventDefault();let e=this.closest(".saml-role");if(!e)return;let o=e.classList.toggle("tm_tags_open");if(this.setAttribute("aria-expanded",o?"true":"false"),o){let n=e.querySelector(".tm_tag_add");n&&Ho(n)}else{let n=e.querySelector(".tm_tag_input");n&&n.blur()}}),i("body").on("click",".tm_tag_del",function(t){t.preventDefault(),t.stopPropagation();let e=this;ie(i(this).closest(".tm_tag_pill"),this,async()=>{let o=e.getAttribute("data-account-id");await Z.removeTag(o,e.getAttribute("data-tag")),Me(o)})}),i("body").on("click",".tm_tag_add",function(t){t.preventDefault(),t.stopPropagation(),Ho(this)}),i("body").on("keydown",".tm_tag_input",async function(t){let e=this.getAttribute("data-account-id");if(t.key==="Enter"||t.key===","){t.preventDefault();let o=this.value.trim();this.value="",o&&(await Z.addTag(e,o),Me(e),Uo(),this.focus())}else t.key==="Escape"&&(t.preventDefault(),this.value="",this.replaceWith(Fo(e)))}),i("body").on("focusout",".tm_tag_input",async function(){if(!this.isConnected)return;let t=this.getAttribute("data-account-id"),e=this.value.trim();this.replaceWith(Fo(t)),e&&(await Z.addTag(t,e),Me(t))}),i("body").on("click",r.SELECTORS.THEME_TOGGLE,async function(t){t.preventDefault(),await Ut.toggleTheme()}),i("body").on("click",r.SELECTORS.COMPACT_TOGGLE,async function(t){t.preventDefault();let e=!zt;await me.saveSetting(e)&&(me.updateButton(),S(`Compact mode ${e?"enabled":"disabled"}!`,"info",r.TOAST_DURATION_LONG))}),i("body").on("click",r.SELECTORS.SIGNIN_TAB_TOGGLE,function(t){t.preventDefault(),Kr()}),i("body").on("click","#tm_manage_shortcuts",function(t){t.preventDefault(),br()}),i("body").on("click","#tm_manage_services",function(t){t.preventDefault(),yr()}),i("body").on("click","#tm_manage_regions",function(t){t.preventDefault(),Mr()}),i("body").on("click","#tm_manage_account_names",function(t){t.preventDefault(),xr()}),i("body").on("click","#tm_manage_account_tags",function(t){t.preventDefault(),Sr()}),i("body").on("click","#tm_manage_jump_dests",function(t){t.preventDefault(),Dr()}),i("body").on("click","#tm_manage_assume_profiles",function(t){t.preventDefault(),jr()});let en=()=>ro(i("#tm_jump_org").val(),i("#tm_jump_account").val(),i("#tm_jump_label").val());i("body").on("click","#tm_jump_pill",function(t){t.preventDefault(),oe?_e():Nr()}),i("body").on("click","#tm_jump_go",function(t){t.preventDefault(),en()}),i("body").on("change","#tm_jump_org",function(){ao()}),i("body").on("click","#tm_sessions_pill",function(t){if(t.preventDefault(),gt){ke();return}gt=!0,i("#tm_sessions_scrim").css("display","block"),i("#tm_sessions_popover").css("display","block"),Jt({keepOpen:!0})}),i("body").on("click","#tm_sessions_close",function(t){t.preventDefault(),ke()}),i("body").on("click",".tm_sess_del",function(t){t.preventDefault(),t.stopPropagation();let e=this,n=i(e).closest(".tm_sess_tr").attr("data-diff");n&&ie(i(e),e,async()=>{S("Signing out that session\u2026","info",r.TOAST_DURATION),chrome.runtime.sendMessage({type:"hop_signout_session",region:X.region(),differentiator:n},a=>{if(chrome.runtime.lastError||!a||!a.ok){S("Could not sign that session out.","error",r.TOAST_DURATION);return}Te=!1,S("Session signed out \u2014 a slot is free.","success",r.TOAST_DURATION),Jt({keepOpen:gt})})})}),i("body").on("click","#tm_sessions_scrim",function(t){t.preventDefault(),t.stopPropagation(),ke()}),i("body").on("click","#tm_sess_signout_all",function(t){t.preventDefault(),t.stopPropagation(),wt.length&&ie(i(this),this,()=>{S("Signing out of every AWS session\u2026","info",r.TOAST_DURATION),chrome.runtime.sendMessage({type:"hop_signout_all",region:X.region()},e=>{if(chrome.runtime.lastError||!e||!e.ok){S("Could not sign the sessions out.","error",r.TOAST_DURATION);return}Te=!1,S(e.done===e.total?`Signed out of ${e.done} session${e.done===1?"":"s"}.`:`Signed out of ${e.done} of ${e.total} sessions.`,e.done===e.total?"success":"error",r.TOAST_DURATION),Jt({keepOpen:gt})})})}),i("body").on("keydown","#tm_jump_account, #tm_jump_label",function(t){t.key==="Enter"&&(t.preventDefault(),en())}),i("body").on("input","#tm_jump_account",function(){St("tm_jump_account","tm_jump_account_wrap")}),i("body").on("click","#tm_jump_account_clear",function(t){t.preventDefault();let e=document.getElementById("tm_jump_account");e&&(e.value="",e.focus()),St("tm_jump_account","tm_jump_account_wrap")}),i("body").on("input","#tm_jump_label",function(){St("tm_jump_label","tm_jump_label_wrap")}),i("body").on("click","#tm_jump_label_clear",function(t){t.preventDefault();let e=document.getElementById("tm_jump_label");e&&(e.value="",e.focus()),St("tm_jump_label","tm_jump_label_wrap")}),i("body").on("click",".tm_jump_recent",function(t){t.target.closest&&t.target.closest(".tm_jump_action")||(t.preventDefault(),ro(i(this).attr("data-org"),i(this).attr("data-account"),i(this).attr("data-label"),{fromRecent:!0}))});let Se=null,ae=()=>{Se&&(clearTimeout(Se),Se=null,i(".tm_confirm_del").removeClass("tm_confirm_del"))},hr=(t,e)=>{ae(),t.addClass("tm_confirm_del"),e&&e.setAttribute&&e.setAttribute("title","Click again to remove"),Se=setTimeout(ae,3500)},ie=(t,e,o)=>{t.hasClass("tm_confirm_del")?(ae(),o()):hr(t,e)};i(document).on("click",function(t){let e=t.target;e&&e.closest&&e.closest(".tm_confirm_del")||ae()}),i("body").on("click",".tm_jump_del",function(t){t.preventDefault();let e=i(this);ie(e,this,()=>{let o=e.closest(".tm_jump_recent");Er(o.attr("data-org"),o.attr("data-account"))})}),i(document).on("click",function(t){if(!oe)return;let e=t.target;e&&e.closest&&(e.closest("#tm_jump_popover")||e.closest("#tm_jump_pill"))||_e()}),i("body").on("click","#tm_start_view",function(t){t.preventDefault(),Xn()}),i("body").on("click","#tm_clear_sessions",function(t){t.preventDefault(),Gr()});let br=()=>{let e=`
            <div id="tm_shortcuts_modal" style="
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                background: rgba(0,0,0,0.5) !important;
                z-index: 10000 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
            ">
                <div style="
                    background: white !important;
                    border-radius: 8px !important;
                    padding: 20px !important;
                    max-width: 500px !important;
                    width: 90% !important;
                    max-height: 80vh !important;
                    overflow-y: auto !important;
                ">
                    <h3 style="margin: 0 0 15px 0 !important; color: #16191f !important;">Custom Shortcuts</h3>
                    <p style="margin: 0 0 15px 0 !important; color: #6c757d !important; font-size: 14px !important;">
                        Create shortcuts with a label and search string. Each line: <code>Label: "search text"</code>.
                        Shortcuts saved from the search box also remember their filter chips \u2014 those are kept as long as you don't rename the label.
                    </p>
                    <textarea id="tm_shortcuts_input" style="
                        width: 100% !important;
                        height: 200px !important;
                        border: 1px solid #ccc !important;
                        border-radius: 4px !important;
                        padding: 10px !important;
                        font-family: monospace !important;
                        font-size: 13px !important;
                        resize: vertical !important;
                        box-sizing: border-box !important;
                    " placeholder="My Sandbox: &quot;sandbox&quot;
Prod Account: &quot;prod&quot;
Account 123456789012: &quot;123456789012&quot;">${at.map(o=>`${o.label}: "${o.search}"`).join(`
`)}</textarea>
                    <div style="margin-top: 15px !important; text-align: right !important;">
                        <button id="tm_shortcuts_cancel" style="
                            padding: 8px 16px !important;
                            margin-right: 10px !important;
                            border: 1px solid #ccc !important;
                            background: white !important;
                            border-radius: 4px !important;
                            cursor: pointer !important;
                        ">Cancel</button>
                        <button id="tm_shortcuts_save" style="
                            padding: 8px 16px !important;
                            border: 1px solid #0073bb !important;
                            background: #0073bb !important;
                            color: white !important;
                            border-radius: 4px !important;
                            cursor: pointer !important;
                        ">Save</button>
                    </div>
                </div>
            </div>
        `;i("body").append(e),i("#tm_shortcuts_cancel, #tm_shortcuts_modal").on("click",function(o){o.target===this&&i("#tm_shortcuts_modal").remove()}),i("#tm_shortcuts_save").on("click",async function(){let o=i("#tm_shortcuts_input").val().trim(),n=[];if(o){let l=o.split(`
`).filter(m=>m.trim());for(let m of l){let h=m.match(/^(.+?):\s*["'](.*?)["']\s*$/);if(h){let T=h[1].trim(),w=at.find(R=>R.label===T);n.push({label:T,search:h[2].trim(),filters:w?w.filters:void 0})}}}let a=new Set;n.forEach(l=>{l.id=ct.uniqueId(l.label,a),a.add(l.id)}),await ct.saveShortcuts(n)&&(ct.updateSection(),i("#tm_shortcuts_modal").remove(),S("Shortcuts saved!","success",r.TOAST_DURATION_LONG))})},yr=()=>{let e=`
            <div id="tm_services_modal" style="
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                background: rgba(0,0,0,0.5) !important;
                z-index: 10000 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
            ">
                <div style="
                    background: white !important;
                    border-radius: 8px !important;
                    padding: 20px !important;
                    max-width: 500px !important;
                    width: 90% !important;
                    max-height: 80vh !important;
                    overflow-y: auto !important;
                ">
                    <h3 style="margin: 0 0 15px 0 !important; color: #16191f !important;">AWS Services</h3>
                    <p style="margin: 0 0 15px 0 !important; color: #6c757d !important; font-size: 14px !important;">
                        Configure quick-access services. Each line: <code>Service Name: "console/path"</code>.
                        Use <code>{region}</code> as a placeholder for the region from General Settings.
                    </p>
                    <textarea id="tm_services_input" style="
                        width: 100% !important;
                        height: 250px !important;
                        border: 1px solid #ccc !important;
                        border-radius: 4px !important;
                        padding: 10px !important;
                        font-family: monospace !important;
                        font-size: 13px !important;
                        resize: vertical !important;
                        box-sizing: border-box !important;
                    " placeholder="CloudWatch: &quot;cloudwatch/home?region={region}&quot;
S3: &quot;s3/home?region={region}&quot;
EC2: &quot;ec2/home?region={region}&quot;
IAM: &quot;iam/home&quot;">${At.map(o=>`${o.name}: "${o.path}"`).join(`
`)}</textarea>
                    <div style="margin-top: 10px !important;">
                        <button id="tm_services_reset" style="
                            padding: 6px 12px !important;
                            border: 1px solid #dc3545 !important;
                            background: white !important;
                            color: #dc3545 !important;
                            border-radius: 4px !important;
                            cursor: pointer !important;
                            font-size: 12px !important;
                        ">Reset to Defaults</button>
                    </div>
                    <div style="margin-top: 15px !important; text-align: right !important;">
                        <button id="tm_services_cancel" style="
                            padding: 8px 16px !important;
                            margin-right: 10px !important;
                            border: 1px solid #ccc !important;
                            background: white !important;
                            border-radius: 4px !important;
                            cursor: pointer !important;
                        ">Cancel</button>
                        <button id="tm_services_save" style="
                            padding: 8px 16px !important;
                            border: 1px solid #0073bb !important;
                            background: #0073bb !important;
                            color: white !important;
                            border-radius: 4px !important;
                            cursor: pointer !important;
                        ">Save</button>
                    </div>
                </div>
            </div>
        `;i("body").append(e),i("#tm_services_cancel, #tm_services_modal").on("click",function(o){o.target===this&&i("#tm_services_modal").remove()}),i("#tm_services_reset").on("click",function(){let o=r.DEFAULT_SERVICES.map(n=>`${n.name}: "${n.path}"`).join(`
`);i("#tm_services_input").val(o),S("Reset to defaults - click Save to apply","info",r.TOAST_DURATION_LONG)}),i("#tm_services_save").on("click",async function(){let o=i("#tm_services_input").val().trim(),n=[];if(o){let s=o.split(`
`).filter(l=>l.trim());for(let l of s){let m=l.match(/^(.+?):\s*["'](.+?)["']\s*$/);if(m){let h=m[1].trim(),T=m[2].trim(),w=h.toLowerCase().replace(/[^a-z0-9]/g,"");n.push({id:w,name:h,path:T})}}}if(n.length===0){S("Please add at least one service","error");return}await V.saveServices(n)&&(i("#tm_services_modal").remove(),S("Services saved! Refresh page to see changes in dropdowns.","success",r.TOAST_DURATION))})},vr=()=>{i(".tm_account_name").each(function(){if(this.closest('.saml-role[data-jump="1"]'))return;let t=this.getAttribute("data-account-id")||"",e=this.getAttribute("data-aws-name")||"";this.textContent=Ot.nameFor(t)||e}),Yt(),K.applyFilters()},xr=()=>{let t=Rn(ne),e=`
            <div id="tm_account_names_modal" style="
                position: fixed !important; top: 0 !important; left: 0 !important;
                right: 0 !important; bottom: 0 !important;
                background: rgba(0,0,0,0.5) !important; z-index: 10000 !important;
                display: flex !important; align-items: center !important; justify-content: center !important;
            ">
                <div style="
                    background: white !important; border-radius: 8px !important; padding: 20px !important;
                    max-width: 520px !important; width: 90% !important; max-height: 80vh !important; overflow-y: auto !important;
                ">
                    <h3 style="margin: 0 0 15px 0 !important; color: #16191f !important;">Account Names</h3>
                    <p style="margin: 0 0 15px 0 !important; color: #6c757d !important; font-size: 14px !important; line-height: 1.45 !important;">
                        Give specific accounts a friendlier name. One per line:
                        <code>123456789012: My Friendly Name</code>. The custom name
                        <strong>replaces</strong> the AWS account name in the list and is
                        used for filtering, grouping and tab titles. Leave the box empty
                        to clear all custom names.
                    </p>
                    <textarea id="tm_account_names_input" style="
                        width: 100% !important; height: 220px !important; border: 1px solid #ccc !important;
                        border-radius: 4px !important; padding: 10px !important; font-family: monospace !important;
                        font-size: 13px !important; resize: vertical !important; box-sizing: border-box !important;
                    " placeholder="123456789012: Prod Logging&#10;999999999999: Security Audit">${v(t)}</textarea>
                    <div style="margin-top: 15px !important; text-align: right !important;">
                        <button id="tm_account_names_cancel" style="
                            padding: 8px 16px !important; margin-right: 10px !important; border: 1px solid #ccc !important;
                            background: white !important; border-radius: 4px !important; cursor: pointer !important;
                        ">Cancel</button>
                        <button id="tm_account_names_save" style="
                            padding: 8px 16px !important; border: 1px solid #0073bb !important; background: #0073bb !important;
                            color: white !important; border-radius: 4px !important; cursor: pointer !important;
                        ">Save</button>
                    </div>
                </div>
            </div>
        `;i("body").append(e),i("#tm_account_names_cancel, #tm_account_names_modal").on("click",function(o){o.target===this&&i("#tm_account_names_modal").remove()}),i("#tm_account_names_save").on("click",async function(){let o=An(i("#tm_account_names_input").val());await Ot.save(o)&&(i("#tm_account_names_modal").remove(),vr(),S("Account names updated.","success",r.TOAST_DURATION))})},wr=()=>{document.querySelectorAll(".tm_tag_chip[data-account-id]").forEach(Po),document.querySelectorAll(".tm_tag_editor[data-account-id] .tm_tag_pills").forEach(zo),Ge(),K.applyFilters(!0)},Sr=()=>{let t=Cn(jt),e=`
            <div id="tm_account_tags_modal" style="
                position: fixed !important; top: 0 !important; left: 0 !important;
                right: 0 !important; bottom: 0 !important;
                background: rgba(0,0,0,0.5) !important; z-index: 10000 !important;
                display: flex !important; align-items: center !important; justify-content: center !important;
            ">
                <div style="
                    background: white !important; border-radius: 8px !important; padding: 20px !important;
                    max-width: 520px !important; width: 90% !important; max-height: 80vh !important; overflow-y: auto !important;
                ">
                    <h3 style="margin: 0 0 15px 0 !important; color: #16191f !important;">Account Tags</h3>
                    <p style="margin: 0 0 15px 0 !important; color: #6c757d !important; font-size: 14px !important; line-height: 1.45 !important;">
                        Attach free-text tags to accounts so you can find them by concept,
                        not just by name. One account per line:
                        <code>123456789012: palo alto, firewall, pci</code>. Tags may contain
                        spaces, and searching any tag surfaces the account. Leave the box empty
                        to clear all tags.
                    </p>
                    <textarea id="tm_account_tags_input" style="
                        width: 100% !important; height: 220px !important; border: 1px solid #ccc !important;
                        border-radius: 4px !important; padding: 10px !important; font-family: monospace !important;
                        font-size: 13px !important; resize: vertical !important; box-sizing: border-box !important;
                    " placeholder="123456789012: palo alto, firewall&#10;999999999999: splunk, siem">${v(t)}</textarea>
                    <div style="margin-top: 15px !important; text-align: right !important;">
                        <button id="tm_account_tags_cancel" style="
                            padding: 8px 16px !important; margin-right: 10px !important; border: 1px solid #ccc !important;
                            background: white !important; border-radius: 4px !important; cursor: pointer !important;
                        ">Cancel</button>
                        <button id="tm_account_tags_save" style="
                            padding: 8px 16px !important; border: 1px solid #0073bb !important; background: #0073bb !important;
                            color: white !important; border-radius: 4px !important; cursor: pointer !important;
                        ">Save</button>
                    </div>
                </div>
            </div>
        `;i("body").append(e),i("#tm_account_tags_cancel, #tm_account_tags_modal").on("click",function(o){o.target===this&&i("#tm_account_tags_modal").remove()}),i("#tm_account_tags_save").on("click",async function(){let o=$n(i("#tm_account_tags_input").val());await Z.save(o)&&(i("#tm_account_tags_modal").remove(),wr(),S("Account tags updated.","success",r.TOAST_DURATION))})},on=(t,e)=>{let o="";return i(".saml-role").each(function(){if(o)return;let n=i(this);n.attr("data-jump")!=="1"&&n.find(".tm_account_id").text().trim()===t&&(e&&n.find(".tm_role_name").text().trim()!==e||(o=n.find(".tm_signin_button").attr("data-role-arn")||""))}),o},Tr=t=>{let e=F.classify("",t);return!e||e==="default"?{envColor:"",envLetter:""}:{envColor:F.colorFor(e),envLetter:F.letterFor(e)}},_e=()=>{i("#tm_jump_popover").css("display","none"),oe=!1},kr=async(t,e,o,n)=>{let a={org:t,account:e,label:(o||"").trim(),role:n||"",ts:Date.now()},s=ut.filter(l=>!(l.org===t&&l.account===e));ut=[a,...s].slice(0,6),await k.saveJumpRecents(ut)},Er=async(t,e)=>{let o=n=>n.org===t&&n.account===e;ut.some(o)&&(ut=ut.filter(n=>!o(n)),await k.saveJumpRecents(ut),io())},ro=async(t,e,o,n={})=>{let a=_t.byName(t);if(!a){S("Pick an org first.","error",r.TOAST_DURATION);return}let s=String(e||"").trim();if(!/^\d{12}$/.test(s)){S("Enter a 12-digit destination account ID.","error",r.TOAST_DURATION);return}let l=on(a.hub,a.hubRole);if(!l){S(a.hubRole?`${a.hubRole} in hub account ${a.hub} isn't in this role list \u2014 check the role name in the assume profile.`:`Hub account ${a.hub} isn't in this role list \u2014 you can only jump from an org whose hub you can sign into here.`,"error",r.TOAST_DURATION_LONG);return}let m=String(o||"").trim().slice(0,120),h=m||`${a.name} \xB7 ${s}`,{envColor:T,envLetter:w}=Tr(s),R=q.find(s,a.name),x=R&&R.name||Ot.nameFor(s)||"",y=so(a.role,x,s);if(y.length>0&&!await sn(x||s,s,a.role,y))return;let d=String(n&&n.region||"").trim().toLowerCase(),g=d||String(i("#tm_jump_region").val()||"").trim().toLowerCase(),O=ht(g)?g:X.region()||r.DEFAULT_AWS_REGION;d||Q.saveLastRegion(No,O);let N=String(n&&n.service||""),M=Vt(N)?N:"";if(!(n&&(n.fromRow||n.fromRecent))&&i("#tm_jump_save_dest").prop("checked")){let f={};m&&(f.label=m),ht(g)&&(f.region=g),await q.upsert(s,a.name,f)}if(n&&n.fromRow){let f=fe(s,a.name);await Q.saveLastRegion(f,O),await V.saveLastService(f,M)}await u(async()=>{let f=(await chrome.storage.local.get("hop_pending_jumps")).hop_pending_jumps||{},b=Date.now();for(let D of Object.keys(f))(!f[D]||!f[D].ts||b-f[D].ts>300*1e3)&&delete f[D];f[s]={label:h,envColor:T,envLetter:w,region:O,service:M,ts:b},await chrome.storage.local.set({hop_pending_jumps:f})});let j=String(l).split("/").pop()||"";await u(async()=>{await chrome.storage.local.set({hop_pending_hub:{account:a.hub,role:j,ts:Date.now()}})}),await kr(t,s,m,a.role);let L={chain:{account:s,role:a.role,displayName:h,region:O}};try{chrome&&chrome.runtime&&chrome.runtime.sendMessage&&chrome.runtime.sendMessage({type:"hop_group_tab",account:s,role:a.role,tag:it||"",mode:st||"role",org:a.name||""})}catch{}_e(),S(`Signing in to the ${a.name} hub, then switching into ${s}\u2026`,"info",r.TOAST_DURATION),L.tok=await Be(),Bo(l,Ye("",L,O),{newTab:!1})},nn=()=>{let t=i("#tm_jump_org");if(!t.length)return;let e=_t.all(),o=t.val();t.html(_t.optionsHTML()),o&&e.some(n=>n.name===o)&&t.val(o)},Ar=t=>{let e=_t.byName(t.profile);return e?on(e.hub,e.hubRole)?{ok:!0,why:""}:{ok:!1,why:"hub role not in today's list"}:{ok:!1,why:`profile "${t.profile}" is not configured`}},Rr=t=>t.name||Ot.nameFor(t.account)||t.label||t.account,Yt=()=>{let t=i("#"+Bt.LIST_ID);if(!t.length)return;let e=q.all(),o=t.find('.saml-role[data-jump="1"]'),n=o.length>0;if(o.remove(),!e.length&&!n){re("source");return}for(let a of e){let s=fe(a.account,a.profile),l=_t.byName(a.profile),m=l&&l.role||"",h=Ar(a),T=Rr(a),w=a.label&&a.label!==T?` \xB7 "${a.label}"`:"",R=h.ok?`via ${a.profile} hub \xB7 max 1 h${w}`:h.why,x=v(s),y=v(a.account),g=(X.rememberRegion()?Q.getLastRegionSync(s):"")||a.region||l&&l.region||X.region()||r.DEFAULT_AWS_REGION,O=V.hasLastServiceSync(s)?V.getLastServiceSync(s):a.service||"",N=`
        <div class="saml-role${h.ok?"":" tm_jump_unavailable"}" data-jump="1"
             data-dest-account="${y}" data-dest-profile="${v(a.profile)}">
            <div class="tm_role_info">
                <button type="button" class="tm_favorite_button" data-role-arn="${x}" title="Add to favorites">\u2606</button>
                <div class="tm_jump_namewrap">
                    <div class="tm_account_name" data-account-id="${y}" data-aws-name="">\u2933 ${v(T)}</div>
                    <div class="tm_jump_via">${v(R)}</div>
                </div>
                <div class="tm_tag_cell">${Do(a.account)}</div>
                <div class="tm_role_name">${v(m)}</div>
            </div>
            <div class="tm_role_buttons">
                <button type="button" class="tm_account_id" data-account-id="${y}" title="Click to copy account ID">${y}</button>
                <select class="tm_service_dropdown" data-role-arn="${x}" data-account-id="${y}">
                  ${V.serviceOptionsHTML(O)}
                </select>
                <select class="tm_region_dropdown" data-role-arn="${x}" title="AWS region to land in after the jump">
                  ${Q.regionOptionsHTML(g)}
                </select>
                <button type="button" class="tm_role_button primary tm_signin_button" data-role-arn="${x}" data-jump="1" title="${h.ok?"Jump \u2014 sign into the hub, then switch into this account (chained sessions last 1 h by AWS)":v(h.why)}">Jump</button>
            </div>
            <div class="tm_tag_editor" data-account-id="${y}">${Go(a.account)}</div>
        </div>
      `;t.append(N)}I(),Bt.applySavedOrder(),Zt.updateButtons(),re("source"),de(),document.body.classList.contains("tm_filters_active")&&K.applyFilters(!0)};await(async()=>{if(!ye.length)return;let t=[...q.all()];for(let o of ye){if(!o||!o.org||!/^\d{12}$/.test(o.account||""))continue;t.some(a=>a.account===o.account&&a.profile.toLowerCase()===o.org.toLowerCase())||t.push({name:"",account:o.account,profile:o.org,region:"",service:"",label:o.label||""})}await q.save(t)&&(ye=[],await k.saveJumpPinned([]))})(),Yt();let Te=!1,Or=t=>{if(!t)return"";let e=Math.max(0,Math.round((Date.now()/1e3-t)/60));return e<60?`${e}m`:`${Math.floor(e/60)}h${e%60?` ${e%60}m`:""}`},$r=t=>{if(!t)return"\u2014";let e=Math.round((t-Date.now()/1e3)/60);return e<=0?"expired":e<60?`${e}m`:`${Math.floor(e/60)}h ${e%60}m`},Cr=(t,e)=>{if(!t)return"";let o=Rt.find(a=>a.account===t);if(o&&o.label)return o.label;let n=ut.find(a=>a&&a.account===t&&(!e||!a.role||a.role===e));return n&&n.label||""},wt=[],Mt=5,rn=!1,gt=!1,ke=()=>{i("#tm_sessions_popover").css("display","none"),i("#tm_sessions_scrim").css("display","none"),gt=!1,ae(),wt.length||i("#tm_sessions_section").hide()},Lr=()=>{let t=i("#tm_sessions_rows");if(!t.length)return;if(!wt.length){t.html('<div id="tm_sessions_empty">No active AWS console sessions.</div>'),i("#tm_sess_signout_all").hide(),i("#tm_sessions_hint").text("All sessions are signed out \u2014 close the panel when you're done.");return}i("#tm_sessions_hint").text("Sign out a session to free a slot for a new sign-in."),i("#tm_sess_signout_all").text(`Sign out all sessions (${wt.length})`).show();let e='<div class="tm_sess_th"><span>Label</span><span>Account &middot; role</span><span>Region</span><span>Tab group</span><span>Started</span><span>Expires</span><span>Tabs</span><span></span></div>',o=wt.slice().sort((n,a)=>(n.authTime||0)-(a.authTime||0)).map(n=>{let a=Ot.nameFor(n.account)||n.alias||n.account||"unknown",s=n.role?`${a} \xB7 ${n.role}`:a,l=Cr(n.account,n.role),m=l||"\u2014",h=(n.regions||[]).join(", ")||"\u2014",T=(n.group||"").replace(new RegExp("^(\\p{Extended_Pictographic}+)(?=\\S)","u"),"$1 ")||"\u2014",w='<span class="tm_sess_del" role="button" tabindex="-1" title="Sign this session out" aria-label="Sign out">&#10005;</span>',R=[l?`Session: ${l}`:"",`Account: ${n.account}${a&&a!==n.account?` (${a})`:""}`,n.role?`Role: ${n.role}`:"",n.sessionName?`Signed in as: ${n.sessionName}`:"",(n.regions||[]).length?`Region: ${(n.regions||[]).join(", ")}`:"",n.group?`Tab group: ${n.group}`:""].filter(Boolean).join(`
`);return`<div class="tm_sess_tr" data-diff="${v(n.differentiator)}" title="${v(R)}"><span class="tm_sess_name">${v(m)}</span><span class="tm_sess_name">${v(s)}</span><span class="tm_sess_meta">${v(h)}</span><span class="tm_sess_meta">${v(T)}</span><span class="tm_sess_meta">${v(Or(n.authTime))} ago</span><span class="tm_sess_meta">${v($r(n.expiry))}</span><span class="tm_sess_meta">${v(String(n.tabs||0))}</span>`+w+"</div>"}).join("");t.html(e+o)},Jt=({keepOpen:t=!1}={})=>{let e=i("#tm_sessions_section");if(e.length)try{chrome.runtime.sendMessage({type:"hop_list_sessions",region:X.region()},o=>{if(chrome.runtime.lastError||!o||!o.ok){gt||e.hide();return}if(wt=Array.isArray(o.sessions)?o.sessions:[],Mt=o.limit||5,rn=!0,!wt.length&&!gt){e.hide();return}let n=wt.length,a=n>=Mt,s=n===Mt-1;i("#tm_sessions_pill_text").text(a?`${n} of ${Mt} \u2014 sign one out`:`${n} of ${Mt} sessions`),i("#tm_sessions_pill").toggleClass("tm_sessions_warn",s).toggleClass("tm_sessions_full",a),i("#tm_sessions_title").text(`Active AWS sessions \u2014 ${n} of ${Mt}`),e.show(),Lr(),!t&&!gt&&ke(),a&&!Te&&(Te=!0,S(`All ${Mt} AWS sessions are in use \u2014 sign one out before signing in again.`,"error",r.TOAST_DURATION_LONG))})}catch{}},Ir=t=>{let e=_t.byName(t);return e&&e.region||Q.jumpRegionSelected()},ao=({preserve:t=!1}={})=>{let e=i("#tm_jump_region");if(!e.length)return;let n=(t?String(e.val()||""):"")||Ir(i("#tm_jump_org").val());e.html(Q.regionOptionsHTML(n))},io=()=>{let t=i("#tm_jump_recents");if(!t.length)return;if(!ut.length){t.html("");return}let e=o=>{let n=v(o.label||Ot.nameFor(o.account)||o.account),a=v(o.account),s=[o.org,o.role].filter(Boolean).map(v).join(" \xB7 ");return`<div class="tm_jump_recent" data-org="${v(o.org)}" data-account="${a}" data-label="${v(o.label||"")}" title="Jump again"><div class="tm_jump_recent_body"><div class="tm_jump_recent_l1"><span class="tm_jump_recent_lbl">${n}</span><span class="tm_jump_recent_acct">${a}</span></div>`+(s?`<div class="tm_jump_recent_meta">${s}</div>`:"")+'</div><span class="tm_jump_action tm_jump_del" role="button" tabindex="-1" title="Delete" aria-label="Delete">\u2715</span></div>'};t.html(ut.map(e).join(""))},Nr=()=>{if(!i("#tm_jump_popover").length)return;nn(),ao(),io();let t=document.getElementById("tm_jump_save_dest");t&&(t.checked=!1),i("#tm_jump_popover").css("display","block"),oe=!0;let e=document.getElementById("tm_jump_account");e&&(e.value="",e.focus()),St("tm_jump_account","tm_jump_account_wrap"),St("tm_jump_label","tm_jump_label_wrap")},an=()=>{let t=i("#tm_jump_section");if(t.length){if(!_t.all().length){_e(),t.hide();return}t.show(),oe&&(nn(),ao(),io())}},jr=()=>{let t=In(Ht),e=`
            <div id="tm_assume_profiles_modal" style="
                position: fixed !important; top: 0 !important; left: 0 !important;
                right: 0 !important; bottom: 0 !important;
                background: rgba(0,0,0,0.5) !important; z-index: 10000 !important;
                display: flex !important; align-items: center !important; justify-content: center !important;
            ">
                <div style="
                    background: white !important; border-radius: 8px !important; padding: 20px !important;
                    max-width: 560px !important; width: 90% !important; max-height: 80vh !important; overflow-y: auto !important;
                ">
                    <h3 style="margin: 0 0 15px 0 !important; color: #16191f !important;">Jump Profiles</h3>
                    <p style="margin: 0 0 15px 0 !important; color: #6c757d !important; font-size: 14px !important; line-height: 1.45 !important;">
                        For accounts you reach by <strong>assuming a role from a hub</strong>
                        (role chaining). One org per line:
                        <code>Org name | 111111111111 | RoleName | region</code> \u2014 the 12-digit
                        <strong>hub</strong> account you sign into, and the <strong>role</strong>
                        to assume in the target. If that hub account has several roles, say which
                        one to sign in as with <code>111111111111/HubRole</code> \u2014 otherwise the
                        first row for that account is used, which may be a role that isn't allowed
                        to assume anything. The <strong>region</strong> is optional: set it
                        and jumps through this org always land there (otherwise the Jump bar
                        falls back to your General Settings region). These feed the
                        <em>Jump to account</em> bar. The trust between hub and target must
                        already exist in AWS.
                    </p>
                    <textarea id="tm_assume_profiles_input" style="
                        width: 100% !important; height: 200px !important; border: 1px solid #ccc !important;
                        border-radius: 4px !important; padding: 10px !important; font-family: monospace !important;
                        font-size: 13px !important; resize: vertical !important; box-sizing: border-box !important;
                    " placeholder="Acme Prod | 111111111111/HubRole | OrgAdmin | eu-central-1&#10;Acme Dev | 222222222222 | OrgAdmin">${v(t)}</textarea>
                    <div style="margin-top: 15px !important; text-align: right !important;">
                        <button id="tm_assume_profiles_cancel" style="
                            padding: 8px 16px !important; margin-right: 10px !important; border: 1px solid #ccc !important;
                            background: white !important; border-radius: 4px !important; cursor: pointer !important;
                        ">Cancel</button>
                        <button id="tm_assume_profiles_save" style="
                            padding: 8px 16px !important; border: 1px solid #0073bb !important; background: #0073bb !important;
                            color: white !important; border-radius: 4px !important; cursor: pointer !important;
                        ">Save</button>
                    </div>
                </div>
            </div>
        `;i("body").append(e),i("#tm_assume_profiles_cancel, #tm_assume_profiles_modal").on("click",function(o){o.target===this&&i("#tm_assume_profiles_modal").remove()}),i("#tm_assume_profiles_save").on("click",async function(){let o=Ln(i("#tm_assume_profiles_input").val());await _t.save(o)&&(i("#tm_assume_profiles_modal").remove(),an(),Yt(),S("Jump profiles saved.","success",r.TOAST_DURATION))})},Dr=()=>{let t=y=>V.serviceOptionsHTML(y),e=y=>`<option value=""${y?"":" selected"}>Default region</option>`+Q.regionOptionsHTML(y||""),o=y=>{let d=_t.byName(y.profile);return d?`assumes ${d.role} via hub ${d.hub}`:"profile not configured"},n=`
      <div class="tm_jdg_row tm_jdg_head">
        <span>Name</span><span>Account</span><span>Profile</span>
        <span>Land on service</span><span>Land in region</span>
        <span>Session label</span><span></span>
      </div>`,a=y=>`
      <div class="tm_jdg_row" data-account="${v(y.account)}" data-profile="${v(y.profile)}">
        <input type="text" class="tm_jd_flat tm_jd_name_input" maxlength="64"
               value="${v(y.name||"")}"
               placeholder="${v(Ot.nameFor(y.account)||y.label||y.account)}"
               title="Display name for the \u2933 row \u2014 saves when you click away">
        <span class="tm_jdg_acct" title="Destination account">${v(y.account)}</span>
        <span class="tm_jdg_profile" title="${v(o(y))}">${v(y.profile)}</span>
        <select class="tm_jd_service" title="Land on service \u2014 saves on change">${t(y.service||"")}</select>
        <select class="tm_jd_region" title="Land in region \u2014 Default follows the profile's region, then General Settings">${e(y.region||"")}</select>
        <input type="text" class="tm_jd_flat tm_jd_label_input" maxlength="120"
               value="${v(y.label||"")}" placeholder="optional"
               title="Session label used when jumping here \u2014 saves when you click away">
        <span class="tm_jdg_actions"><button type="button" class="tm_jd_del" title="Remove this destination">&#10005;</button></span>
      </div>`,s=()=>_t.optionsHTML(),l=()=>`
      <div class="tm_jdg_row tm_jdg_add">
        <input type="text" id="tm_jd_add_name" class="tm_jd_addcell" maxlength="64" placeholder="Name (optional)">
        <input type="text" id="tm_jd_add_account" class="tm_jd_addcell tm_jdg_acct_input" maxlength="12" inputmode="numeric" placeholder="12-digit id">
        <select id="tm_jd_add_profile" class="tm_jd_addcell">${s()}</select>
        <select id="tm_jd_add_service" class="tm_jd_addcell">${t("")}</select>
        <select id="tm_jd_add_region" class="tm_jd_addcell">${e("")}</select>
        <input type="text" id="tm_jd_add_label" class="tm_jd_addcell" maxlength="120" placeholder="optional">
        <span class="tm_jdg_actions"><button type="button" id="tm_jd_add_btn">Add</button></span>
      </div>`,m=()=>{let y=q.all(),d=y.length?y.map(a).join(""):`<div class="tm_jd_empty">No saved destinations yet \u2014 fill the row below, tick
            "Save as a named destination" when you jump, or paste a list via Import.</div>`;return n+d+l()},h=()=>{i("#tm_jd_list").html(m())},T=async(y,d,g)=>{await q.upsert(y,d,g),Yt()},w=`
      <div id="tm_jump_dests_modal" style="
          position: fixed !important; top: 0 !important; left: 0 !important;
          right: 0 !important; bottom: 0 !important;
          background: rgba(0,0,0,0.5) !important; z-index: 10000 !important;
          display: flex !important; align-items: center !important; justify-content: center !important;
      ">
        <div style="
            background: white !important; border-radius: 8px !important; padding: 20px !important;
            max-width: 940px !important; width: 94% !important; max-height: 84vh !important; overflow-y: auto !important;
        ">
          <h3 style="margin: 0 0 12px 0 !important; color: #16191f !important;">Jump Destinations</h3>
          <p style="margin: 0 0 12px 0 !important; color: #6c757d !important; font-size: 13.5px !important; line-height: 1.45 !important;">
            Saved chained-jump targets. Each one shows as a <strong>\u2933 row in the role
            listing</strong> \u2014 searchable, taggable, favouritable like any row \u2014 and jumps
            through its profile's hub. Click any name or session label and type \u2014 it saves
            when you click away; service and region save as you change them. The last line
            adds a new destination. Account and profile are fixed once added (remove and
            re-add to change), and removing one only forgets this entry \u2014 it never
            touches AWS.
          </p>
          <div id="tm_jd_list">${m()}</div>
          <div id="tm_jd_add_err"></div>
          <div style="margin-top: 14px !important; display: flex !important; justify-content: space-between !important; align-items: center !important; gap: 10px !important;">
            <button type="button" id="tm_jd_import" style="
                padding: 8px 14px !important; border: 1px solid #ccc !important;
                background: white !important; border-radius: 4px !important; cursor: pointer !important;
            " title="Paste destinations as lines: Name | account | profile | region | service | label">Import\u2026</button>
            <button type="button" id="tm_jd_close" style="
                padding: 8px 16px !important; border: 1px solid #0073bb !important; background: #0073bb !important;
                color: white !important; border-radius: 4px !important; cursor: pointer !important;
            ">Close</button>
          </div>
        </div>
      </div>
    `;i("body").append(w);let R=i("#tm_jump_dests_modal");R.on("click",function(y){y.target===this&&R.remove()}),R.on("click","#tm_jd_close",function(){R.remove()});let x=y=>{let d=i(y).closest(".tm_jdg_row");return{account:d.attr("data-account")||"",profile:d.attr("data-profile")||""}};R.on("change",".tm_jd_service",function(){let{account:y,profile:d}=x(this);V.clearLastService(fe(y,d)),T(y,d,{service:String(this.value||"")})}),R.on("change",".tm_jd_region",function(){let{account:y,profile:d}=x(this);Q.clearLastRegion(fe(y,d)),T(y,d,{region:String(this.value||"")})}),R.on("focusout",".tm_jd_name_input",function(){let{account:y,profile:d}=x(this),g=q.find(y,d);if(!g)return;let O=String(this.value||"").trim();O!==(g.name||"")&&T(y,d,{name:O})}),R.on("focusout",".tm_jd_label_input",function(){let{account:y,profile:d}=x(this),g=q.find(y,d);if(!g)return;let O=String(this.value||"").trim();O!==(g.label||"")&&T(y,d,{label:O})}),R.on("click",".tm_jd_del",function(y){y.preventDefault();let d=this,{account:g,profile:O}=x(d);ie(i(d),d,async()=>{await q.remove(g,O),Yt(),h()})}),R.on("click","#tm_jd_add_btn",async function(){let y=String(i("#tm_jd_add_name").val()||"").trim(),d=String(i("#tm_jd_add_account").val()||"").trim(),g=String(i("#tm_jd_add_profile").val()||""),O=String(i("#tm_jd_add_label").val()||"").trim(),N=i("#tm_jd_add_err");if(!/^\d{12}$/.test(d)){N.text("The account must be a 12-digit id.");return}if(!g){N.text("Configure a Jump Profile first \u2014 destinations jump through a profile's hub.");return}N.text("");let M=!!q.find(d,g);await q.upsert(d,g,{name:y,label:O,service:String(i("#tm_jd_add_service").val()||""),region:String(i("#tm_jd_add_region").val()||"")}),M&&S("That account + profile was already saved \u2014 updated the existing destination.","info",r.TOAST_DURATION_LONG),Yt(),h()}),R.on("click","#tm_jd_import",function(){let y=Dn(q.all(),At),d=`
        <div id="tm_jd_import_modal" style="
            position: fixed !important; top: 0 !important; left: 0 !important;
            right: 0 !important; bottom: 0 !important;
            background: rgba(0,0,0,0.5) !important; z-index: 10001 !important;
            display: flex !important; align-items: center !important; justify-content: center !important;
        ">
          <div style="
              background: white !important; border-radius: 8px !important; padding: 20px !important;
              max-width: 640px !important; width: 92% !important;
          ">
            <h3 style="margin: 0 0 12px 0 !important; color: #16191f !important;">Import destinations</h3>
            <p style="margin: 0 0 12px 0 !important; color: #6c757d !important; font-size: 13px !important; line-height: 1.45 !important;">
              One per line: <code>Name | account | profile | region | service | label</code>.
              Only account + profile are required; start a line with the bare 12-digit id
              to skip the name. The service takes a Services entry's name (e.g. CloudWatch).
              Imported lines replace the whole list \u2014 it's pre-filled with the current one.
            </p>
            <textarea id="tm_jd_import_text" style="
                width: 100% !important; height: 180px !important; border: 1px solid #ccc !important;
                border-radius: 4px !important; padding: 10px !important; font-family: monospace !important;
                font-size: 12.5px !important; resize: vertical !important; box-sizing: border-box !important;
            " placeholder="Payments prod | 484848484848 | Org A | eu-west-1 | RDS | db failover">${v(y)}</textarea>
            <div style="margin-top: 12px !important; text-align: right !important;">
              <button type="button" id="tm_jd_import_cancel" style="
                  padding: 8px 14px !important; margin-right: 10px !important; border: 1px solid #ccc !important;
                  background: white !important; border-radius: 4px !important; cursor: pointer !important;
              ">Cancel</button>
              <button type="button" id="tm_jd_import_go" style="
                  padding: 8px 14px !important; border: 1px solid #0073bb !important; background: #0073bb !important;
                  color: white !important; border-radius: 4px !important; cursor: pointer !important;
              ">Import</button>
            </div>
          </div>
        </div>
      `;i("body").append(d);let g=i("#tm_jd_import_modal");g.on("click",function(O){O.target===this&&g.remove()}),g.on("click","#tm_jd_import_cancel",function(){g.remove()}),g.on("click","#tm_jd_import_go",async function(){let O=jn(String(i("#tm_jd_import_text").val()||""),At);await q.save(O)&&(g.remove(),Yt(),h(),S(`Imported ${O.length} destination${O.length===1?"":"s"}.`,"success",r.TOAST_DURATION))})})},Mr=()=>{let t=bo(Ft),e=`
            <div id="tm_regions_modal" style="
                position: fixed !important; top: 0 !important; left: 0 !important;
                right: 0 !important; bottom: 0 !important;
                background: rgba(0,0,0,0.5) !important; z-index: 10000 !important;
                display: flex !important; align-items: center !important; justify-content: center !important;
            ">
                <div style="
                    background: white !important; border-radius: 8px !important; padding: 20px !important;
                    max-width: 500px !important; width: 90% !important; max-height: 80vh !important; overflow-y: auto !important;
                ">
                    <h3 style="margin: 0 0 15px 0 !important; color: #16191f !important;">Regions</h3>
                    <p style="margin: 0 0 15px 0 !important; color: #6c757d !important; font-size: 14px !important;">
                        One region per line, in the order they should appear in the toolbar switcher.
                        Use <code>code</code> or <code>code: Friendly Label</code>
                        (e.g. <code>eu-west-1: Ireland</code>). The default selection stays whatever
                        you set in <em>General Settings</em>.
                    </p>
                    <textarea id="tm_regions_input" style="
                        width: 100% !important; height: 250px !important; border: 1px solid #ccc !important;
                        border-radius: 4px !important; padding: 10px !important; font-family: monospace !important;
                        font-size: 13px !important; resize: vertical !important; box-sizing: border-box !important;
                    " placeholder="us-east-1: US East (N. Virginia)&#10;eu-west-1: Ireland&#10;ap-southeast-2: Sydney">${v(t)}</textarea>
                    <div style="margin-top: 10px !important;">
                        <button id="tm_regions_reset" style="
                            padding: 6px 12px !important; border: 1px solid #dc3545 !important; background: white !important;
                            color: #dc3545 !important; border-radius: 4px !important; cursor: pointer !important; font-size: 12px !important;
                        ">Reset to Defaults</button>
                    </div>
                    <div style="margin-top: 15px !important; text-align: right !important;">
                        <button id="tm_regions_cancel" style="
                            padding: 8px 16px !important; margin-right: 10px !important; border: 1px solid #ccc !important;
                            background: white !important; border-radius: 4px !important; cursor: pointer !important;
                        ">Cancel</button>
                        <button id="tm_regions_save" style="
                            padding: 8px 16px !important; border: 1px solid #0073bb !important; background: #0073bb !important;
                            color: white !important; border-radius: 4px !important; cursor: pointer !important;
                        ">Save</button>
                    </div>
                </div>
            </div>
        `;i("body").append(e),i("#tm_regions_cancel, #tm_regions_modal").on("click",function(o){o.target===this&&i("#tm_regions_modal").remove()}),i("#tm_regions_reset").on("click",function(){i("#tm_regions_input").val(bo(r.DEFAULT_REGION_LIST)),S("Reset to defaults - click Save to apply","info",r.TOAST_DURATION_LONG)}),i("#tm_regions_save").on("click",async function(){let o=En(i("#tm_regions_input").val());if(o.length===0){S("Add at least one valid region","error");return}await Q.saveRegions(o)&&(i("#tm_regions_modal").remove(),S("Regions saved! Refresh page to see changes in the dropdowns.","success",r.TOAST_DURATION))})},Gr=()=>{i("body").append(`
            <div id="tm_clear_sessions_modal" style="
                position: fixed !important; top: 0 !important; left: 0 !important;
                right: 0 !important; bottom: 0 !important;
                background: rgba(0,0,0,0.5) !important; z-index: 10000 !important;
                display: flex !important; align-items: center !important; justify-content: center !important;
            ">
                <div style="
                    background: white !important; border-radius: 8px !important; padding: 20px !important;
                    max-width: 460px !important; width: 90% !important;
                ">
                    <h3 style="margin: 0 0 12px 0 !important; color: #16191f !important;">Clear all AWS sessions?</h3>
                    <p style="margin: 0 0 18px 0 !important; color: #6c757d !important; font-size: 14px !important; line-height: 1.5 !important;">
                        This signs you out of your AWS console sessions by clearing
                        <code>aws.amazon.com</code> authentication cookies. Sessions held
                        elsewhere \u2014 an IAM Identity Center portal on
                        <code>awsapps.com</code>, for instance \u2014 are outside the
                        extension's reach and stay signed in. Your console favorites and
                        settings are kept; you'll just need to pick a role and sign in
                        again.
                    </p>
                    <div style="text-align: right !important;">
                        <button id="tm_clear_sessions_cancel" type="button" style="
                            padding: 8px 16px !important; margin-right: 10px !important;
                            border: 1px solid #ccc !important; background: white !important;
                            border-radius: 4px !important; cursor: pointer !important;
                        ">Cancel</button>
                        <button id="tm_clear_sessions_confirm" type="button" style="
                            padding: 8px 16px !important; border: 1px solid #dc3545 !important;
                            background: #dc3545 !important; color: white !important;
                            border-radius: 4px !important; cursor: pointer !important;
                        ">Clear sessions</button>
                    </div>
                </div>
            </div>
        `),i("#tm_clear_sessions_cancel, #tm_clear_sessions_modal").on("click",function(e){e.target===this&&i("#tm_clear_sessions_modal").remove()}),i("#tm_clear_sessions_confirm").on("click",function(){i("#tm_clear_sessions_modal").remove();try{chrome.runtime.sendMessage({type:"hop_clear_sessions"},e=>{if(chrome.runtime.lastError||!e||!e.ok){S("Couldn't clear AWS sessions","error",r.TOAST_DURATION);return}let o=e.count;S(`Cleared ${o} AWS cookie${o===1?"":"s"} \u2014 you're signed out`,"success",r.TOAST_DURATION)})}catch{S("Couldn't clear AWS sessions","error",r.TOAST_DURATION)}})},so=(t,e,o)=>{let n=[],a=(t||"").toLowerCase();for(let s of X.signinRoleKeywords())if(s&&a.includes(s.toLowerCase())){n.push(s.charAt(0).toUpperCase()+s.slice(1)+" role");break}for(let s of X.signinTypeIds()){let l=ot.findEntry(s);l&&ot.matches(s,e,o)&&n.push(`${l.label} account`)}return n},sn=(t,e,o,n)=>new Promise(a=>{let l=`
        <div id="tm_signin_confirm_modal" style="
            position: fixed !important;
            top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
            background: rgba(0,0,0,0.55) !important;
            z-index: 10001 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
        ">
          <div style="
              background: white !important;
              border-radius: 8px !important;
              padding: 22px 24px !important;
              max-width: 520px !important;
              width: 90% !important;
              border-top: 6px solid #dc3545 !important;
              box-shadow: 0 8px 32px rgba(0,0,0,0.25) !important;
          ">
            <div style="
                font-size: 12px !important;
                font-weight: 600 !important;
                letter-spacing: 1px !important;
                text-transform: uppercase !important;
                color: #dc3545 !important;
                margin-bottom: 8px !important;
            ">Sensitive sign-in</div>
            <div style="display: grid !important; gap: 8px !important; margin-bottom: 18px !important;">
              ${n.map(T=>`
        <div style="
            background: #dc3545 !important;
            color: #fff !important;
            padding: 14px 20px !important;
            border-radius: 6px !important;
            font-size: 20px !important;
            font-weight: 700 !important;
            line-height: 1.2 !important;
            letter-spacing: 0.2px !important;
            text-align: center !important;
            box-shadow: 0 2px 6px rgba(220,53,69,0.25) !important;
        ">${nt(T)}</div>
      `).join("")}
            </div>
            <div style="
                background: #f8f9fa !important;
                border: 1px solid #e1e4e8 !important;
                border-radius: 4px !important;
                padding: 10px 12px !important;
                margin: 0 0 18px 0 !important;
                font-size: 13px !important;
                color: #16191f !important;
            ">
              <div style="margin-bottom: 2px !important;"><span style="color:#6c757d !important;">Account:</span> <strong>${nt(t)}</strong> <span style="color:#6c757d !important;">(${nt(e)})</span></div>
              <div><span style="color:#6c757d !important;">Role:</span> <strong>${nt(o)}</strong></div>
            </div>
            <div style="text-align: right !important;">
              <button data-action="cancel" style="
                  padding: 8px 16px !important;
                  margin-right: 10px !important;
                  border: 1px solid #ccc !important;
                  background: white !important;
                  border-radius: 4px !important;
                  cursor: pointer !important;
              ">Cancel</button>
              <button data-action="confirm" style="
                  padding: 8px 16px !important;
                  border: 1px solid #dc3545 !important;
                  background: #dc3545 !important;
                  color: white !important;
                  border-radius: 4px !important;
                  cursor: pointer !important;
                  font-weight: 600 !important;
              ">Yes, sign in</button>
            </div>
          </div>
        </div>
      `;i("body").append(l);let m=i("#tm_signin_confirm_modal"),h=T=>{m.remove(),a(T)};m.on("click",function(T){T.target===this&&h(!1)}),m.find('[data-action="cancel"]').on("click",()=>h(!1)),m.find('[data-action="confirm"]').on("click",()=>h(!0))}),cn=["#0073bb","#dc3545","#28a745","#ffc107","#17a2b8","#6610f2","#e83e8c","#6c757d"],Ee=t=>{let{modalId:e,title:o,description:n,patternHelp:a="One pattern per line \u2014 substring of account name or full account ID.",addButtonLabel:s="Add entry",labelPlaceholder:l="Label (shown on the toolbar)",defaults:m,current:h,onSave:T,onAfterSave:w,toastOnSave:R,onChangeIds:x}=t,y=JSON.parse(JSON.stringify(h||[])),d=L=>nt(L).replace(/"/g,"&quot;"),g=(L,f)=>`
      <div class="tm_entry_row" data-orig-id="${d(L.id)}" data-idx="${f}" style="
          display: grid !important;
          grid-template-columns: 36px 1fr auto !important;
          gap: 10px !important;
          align-items: start !important;
          padding: 10px !important;
          border: 1px solid #e1e4e8 !important;
          border-radius: 6px !important;
          margin-bottom: 10px !important;
          background: #fafbfc !important;
      ">
        <input type="color" class="tm_entry_color" value="${d(L.color||"#0073bb")}" style="
            width: 36px !important; height: 36px !important;
            border: 1px solid #ccc !important; border-radius: 4px !important;
            padding: 0 !important; background: white !important; cursor: pointer !important;
        " />
        <div style="display: flex !important; flex-direction: column !important; gap: 6px !important; min-width: 0 !important;">
          <input type="text" class="tm_entry_label" value="${d(L.label||"")}" placeholder="${d(l)}" style="
              width: 100% !important;
              height: 30px !important;
              padding: 4px 8px !important;
              border: 1px solid #ccc !important;
              border-radius: 4px !important;
              font-size: 13px !important;
              font-weight: 600 !important;
              box-sizing: border-box !important;
          " />
          <textarea class="tm_entry_patterns" placeholder="${d(a)}" style="
              width: 100% !important;
              height: 70px !important;
              border: 1px solid #ccc !important;
              border-radius: 4px !important;
              padding: 6px 8px !important;
              font-family: monospace !important;
              font-size: 12px !important;
              resize: vertical !important;
              box-sizing: border-box !important;
          ">${nt((L.patterns||[]).join(`
`))}</textarea>
        </div>
        <button class="tm_entry_remove" type="button" title="Remove entry" style="
            width: 28px !important; height: 28px !important;
            border: 1px solid #dc3545 !important;
            background: white !important; color: #dc3545 !important;
            border-radius: 4px !important; cursor: pointer !important;
            font-size: 16px !important; line-height: 1 !important; padding: 0 !important;
        ">\xD7</button>
      </div>
    `,O=(L,f)=>{L.find(".tm_entries_list").html(f.map(g).join("")||`<div style="color:#6c757d !important; font-size: 13px !important; padding: 10px 0 !important;">No entries yet. Click "${d(s)}" to create one.</div>`)},N=`
      <div id="${e}" style="
          position: fixed !important;
          top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
          background: rgba(0,0,0,0.5) !important;
          z-index: 10000 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
      ">
        <div style="
            background: white !important;
            border-radius: 8px !important;
            padding: 20px !important;
            max-width: 640px !important;
            width: 92% !important;
            max-height: 88vh !important;
            overflow-y: auto !important;
        ">
          <h3 style="margin: 0 0 8px 0 !important; color: #16191f !important;">${o}</h3>
          <p style="margin: 0 0 14px 0 !important; color: #6c757d !important; font-size: 13px !important;">${n}</p>
          <div class="tm_entries_list"></div>
          <div style="display: flex !important; gap: 10px !important; margin-top: 8px !important;">
            <button data-action="add" type="button" style="
                padding: 6px 12px !important;
                border: 1px solid #0073bb !important;
                background: white !important;
                color: #0073bb !important;
                border-radius: 4px !important;
                cursor: pointer !important;
                font-size: 12px !important;
            ">+ ${d(s)}</button>
            <button data-action="reset" type="button" style="
                padding: 6px 12px !important;
                border: 1px solid #dc3545 !important;
                background: white !important;
                color: #dc3545 !important;
                border-radius: 4px !important;
                cursor: pointer !important;
                font-size: 12px !important;
            ">Reset to Defaults</button>
          </div>
          <div style="margin-top: 16px !important; text-align: right !important;">
            <button data-action="cancel" type="button" style="
                padding: 8px 16px !important;
                margin-right: 10px !important;
                border: 1px solid #ccc !important;
                background: white !important;
                border-radius: 4px !important;
                cursor: pointer !important;
            ">Cancel</button>
            <button data-action="save" type="button" style="
                padding: 8px 16px !important;
                border: 1px solid #0073bb !important;
                background: #0073bb !important;
                color: white !important;
                border-radius: 4px !important;
                cursor: pointer !important;
            ">Save</button>
          </div>
        </div>
      </div>
    `;i("body").append(N);let M=i(`#${e}`),j=()=>M.remove();O(M,y),M.on("click",function(L){L.target===this&&j()}),M.find('[data-action="cancel"]').on("click",j),M.on("click",".tm_entry_remove",function(){i(this).closest(".tm_entry_row").remove()}),M.find('[data-action="add"]').on("click",function(){let L=M.find(".tm_entries_list");L.find(".tm_entry_row").length===0&&L.empty();let f=cn[L.find(".tm_entry_row").length%cn.length];L.append(g({id:"",label:"",color:f,patterns:[]},L.find(".tm_entry_row").length)),L.find(".tm_entry_row").last().find(".tm_entry_label").trigger("focus")}),M.find('[data-action="reset"]').on("click",function(){O(M,JSON.parse(JSON.stringify(m||[]))),S("Reset to defaults \u2014 click Save to apply","info",r.TOAST_DURATION_LONG)}),M.find('[data-action="save"]').on("click",async function(){let L=[],f={},b=[];M.find(".tm_entry_row").each(function(){let J=i(this),et=(J.find(".tm_entry_label").val()||"").trim(),_o=(J.find(".tm_entry_color").val()||"").trim()||"#0073bb",go=(J.find(".tm_entry_patterns").val()||"").split(`
`).map(ta=>ta.trim()).filter(Boolean);if(!et)return;let se=(J.attr("data-orig-id")||"").trim(),Zr=se||Co(et),Ce=Pn(Zr,b);b.push(Ce),se&&se!==Ce&&(f[se]=Ce),L.push({id:Ce,label:et,color:_o,patterns:go})}),await T(L)&&(x&&await x(f),w&&await w(),j(),S(R||"Saved!","success",r.TOAST_DURATION))})},pn=5,ln=220,$=null,Ae=!1,Pr=t=>{if(!t)return!1;if(t.closest&&t.closest(".tm_role_buttons")||t.closest&&t.closest(".tm_account_id"))return!0;let e=(t.tagName||"").toLowerCase();return["button","select","input","a","textarea"].includes(e)};i("body").on("pointerdown","#tm_role_list .saml-role",function(t){$||t.button===0&&(Pr(t.target)||($={row:this,pointerId:t.pointerId,startY:t.clientY,startX:t.clientX,activated:!1,filtersBlocked:document.body.classList.contains("tm_filters_active"),listId:Bt.LIST_ID,rowClass:"saml-role",activeClass:"tm_role_dragging_active",onReorder:()=>Bt.saveCurrentOrder()}))});let zr=()=>{let t=document.getElementById($.listId);if(!t){$=null;return}let e=Array.from(t.children).filter(l=>l.classList&&l.classList.contains($.rowClass)&&(!$.rowFilter||$.rowFilter(l))&&getComputedStyle(l).display!=="none"),o=e.indexOf($.row);if(o<0){$=null;return}$.list=t,$.rows=e,$.draggedIndex=o,$.targetIndex=o,$.rowCenters=e.map(l=>{let m=l.getBoundingClientRect();return m.top+m.height/2});let n=$.row.getBoundingClientRect(),a=getComputedStyle($.row),s=parseFloat(getComputedStyle(t).rowGap)||0;$.rowOffset=n.height+(parseFloat(a.marginBottom)||0)+s;try{$.row.setPointerCapture($.pointerId)}catch{}$.row.classList.add("tm_dragging"),$.row.style.setProperty("transition","none","important"),document.body.classList.add($.activeClass),$.activated=!0},Ur=t=>{if(!$||!$.activated)return;let e=t.clientY-$.startY;$.row.style.transform=`translate3d(0, ${e}px, 0)`;let o=$.rowCenters[$.draggedIndex]+e,n=$.draggedIndex;if(e>0){for(let l=$.rows.length-1;l>$.draggedIndex;l--)if(o>$.rowCenters[l]){n=l;break}}else if(e<0){for(let l=0;l<$.draggedIndex;l++)if(o<$.rowCenters[l]){n=l;break}}$.targetIndex=n;let a=$.rowOffset,s=$.draggedIndex;$.rows.forEach((l,m)=>{if(m===s)return;let h=0;s<n&&m>s&&m<=n?h=-a:s>n&&m>=n&&m<s&&(h=a),l.style.transform=h?`translate3d(0, ${h}px, 0)`:""})},mn=async t=>{if(!$)return;if(!$.activated){$=null;return}t&&t.preventDefault&&t.preventDefault(),Ae=!0,setTimeout(()=>{Ae=!1},250);let{row:e,rows:o,list:n,draggedIndex:a,targetIndex:s,pointerId:l,activeClass:m,onReorder:h}=$;$=null;let T=o.map(x=>x.getBoundingClientRect().top);if(o.forEach(x=>{x.style.setProperty("transition","none","important"),x.style.transform=""}),a!==s&&n){let x=s>a?o[s].nextSibling:o[s];n.insertBefore(e,x)}let w=o.map(x=>x.getBoundingClientRect().top);o.forEach((x,y)=>{let d=T[y]-w[y];d!==0&&(x.style.transform=`translate3d(0, ${d}px, 0)`)}),n&&n.offsetWidth;let R="cubic-bezier(0.22, 0.61, 0.36, 1)";o.forEach(x=>{x.style.setProperty("transition",`transform ${ln}ms ${R}`,"important"),x.style.transform=""}),setTimeout(async()=>{o.forEach(x=>{x.style.removeProperty("transition"),x.style.transform=""}),e.classList.remove("tm_dragging"),document.body.classList.remove(m);try{e.releasePointerCapture(l)}catch{}a!==s&&await h()},ln+30)};i(window).on("pointermove",function(t){if(!$||$.pointerId!==t.pointerId)return;let e=Math.abs(t.clientX-$.startX),o=t.clientY-$.startY;if(!$.activated){if(Math.abs(o)<pn&&e<pn)return;if($.filtersBlocked){S("Clear filters to reorder roles","info",r.TOAST_DURATION),$=null;return}if(zr(t),!$)return}t.preventDefault(),Ur(t)}),i(window).on("pointerup",function(t){!$||$.pointerId!==t.pointerId||mn(t)}),i(window).on("pointercancel",function(t){!$||$.pointerId!==t.pointerId||mn(t)}),document.addEventListener("click",function(t){Ae&&(Ae=!1,t.stopPropagation(),t.preventDefault())},!0);let co=()=>i(".saml-role").filter(function(){return i(this).css("display")!=="none"}).get(),Fr=t=>{let e=co();if(e.length===0)return;let o=Math.max(0,Math.min(t,e.length-1));i(".saml-role.tm_kb_selected").removeClass("tm_kb_selected"),i(e[o]).addClass("tm_kb_selected")[0].scrollIntoView({block:"nearest"})},dn=t=>{let e=co();if(e.length===0)return;let o=e.findIndex(a=>a.classList.contains("tm_kb_selected")),n=o<0?t>0?0:e.length-1:o+t;Fr((n+e.length)%e.length)},Wt=t=>{if(!t)return!1;let e=(t.tagName||"").toLowerCase();return!!(e==="input"||e==="textarea"||e==="select"||t.isContentEditable)},Re=()=>i(r.SELECTORS.SEARCH_INPUT);i(document).on("keydown",function(t){let e=i('[id$="_modal"]').first(),o=e.length>0;if(t.key==="Alt"&&!t.repeat&&!o&&!t.metaKey&&!t.ctrlKey&&!Wt(document.activeElement)){let n=Re();n.length&&n.trigger("focus")}if(t.key==="Escape"){if(oe){_e();return}if(o){e.remove();return}if(W>=0&&document.activeElement&&document.activeElement.id==="tm_search_input"){W=-1,Tt();return}if(i(".saml-role.tm_kb_selected").length){i(".saml-role.tm_kb_selected").removeClass("tm_kb_selected");return}if(Wt(t.target)){i(t.target).blur();return}K.clearAll();return}if(o){if(t.key==="Enter"&&!Wt(t.target)){let n=e.find("button").last();n.length&&(t.preventDefault(),n.trigger("click"))}return}if(!Wt(t.target)&&t.key==="/"||(t.ctrlKey||t.metaKey)&&t.key.toLowerCase()==="k"){t.preventDefault();let n=Re();n.length&&n.trigger("focus").trigger("select");return}if(!(Wt(t.target)&&t.target.id!=="tm_search_input"&&!i(t.target).is(r.SELECTORS.SEARCH_INPUT))){if(t.altKey&&(t.key==="ArrowDown"||t.key==="ArrowUp"||t.key==="ArrowLeft"||t.key==="ArrowRight")&&document.activeElement&&document.activeElement.id==="tm_search_input"&&Lt.length){t.preventDefault(),Xr(t.key);return}if(t.key==="ArrowDown"){t.preventDefault(),dn(1);return}if(t.key==="ArrowUp"){t.preventDefault(),dn(-1);return}if(t.key==="Enter"){if(t.preventDefault(),W>=0&&document.activeElement&&document.activeElement.id==="tm_search_input"&&Lt[W]!=null){bn(Lt[W]);return}let n=co(),a=i(".saml-role.tm_kb_selected").get().find(l=>n.includes(l));if(!a)return;let s=i(a).find(".tm_signin_button");if(s.length){let l=i.Event("click",{metaKey:t.metaKey,ctrlKey:t.ctrlKey});s.trigger(l)}return}if(t.key.length===1&&!t.ctrlKey&&!t.metaKey&&!t.altKey&&!Wt(t.target)){let n=Re();n.length&&(t.preventDefault(),n.trigger("focus"),n.val((n.val()||"")+t.key).trigger("input"))}}}),i(document).on("paste",function(t){if(Wt(t.target)||i('[id$="_modal"]').length)return;let e=Re();if(!e.length)return;let o=(t.originalEvent||t).clipboardData;if(!o)return;let n=o.getData("text");n&&(t.preventDefault(),e.trigger("focus"),e.val((e.val()||"")+n).trigger("input"))});let un=({firstRun:t=!1}={})=>{i("#tm_about_modal").remove();let e=t?`<p style="margin:0 0 12px 0 !important; color:#16191f !important; font-size:14px !important; line-height:1.5 !important;">
            Welcome! Console Hopper turns the AWS SAML role picker into a fast,
            filterable launcher with colour-coded console tabs. Here's what it
            does and where to configure it.
         </p>`:`<p style="margin:0 0 12px 0 !important; color:#16191f !important; font-size:14px !important; line-height:1.5 !important;">
            Console Hopper turns the AWS SAML role picker into a fast,
            filterable launcher with colour-coded console tabs.
         </p>`,o=(l,m)=>`
      <div style="margin: 0 0 12px 0 !important;">
        <div style="font-weight: 600 !important; color:#16191f !important; font-size:13px !important; margin-bottom: 4px !important;">${l}</div>
        <div style="color:#6c757d !important; font-size:13px !important; line-height:1.5 !important;">${m}</div>
      </div>
    `,n=`
      <div id="tm_about_modal" style="
          position: fixed !important;
          top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
          background: rgba(0,0,0,0.55) !important;
          z-index: 10001 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
      ">
        <div style="
            background: white !important;
            border-radius: 8px !important;
            padding: 24px 26px !important;
            max-width: 620px !important;
            width: 92% !important;
            max-height: 88vh !important;
            overflow-y: auto !important;
            border-top: 6px solid #0073bb !important;
            box-shadow: 0 8px 32px rgba(0,0,0,0.25) !important;
        ">
          <div style="
              font-size: 11px !important;
              letter-spacing: 1.2px !important;
              text-transform: uppercase !important;
              color: #0073bb !important;
              font-weight: 700 !important;
              margin-bottom: 4px !important;
          ">${t?"Welcome":"Help &amp; About"}</div>
          <h3 style="margin: 0 0 12px 0 !important; color:#16191f !important; font-size: 18px !important;">Console Hopper</h3>
          ${e}
          ${o("Filter, search, favorite",'Narrow the role list from the toolbar \u2014 by organisation, environment, account type, role name or <strong>tag</strong> \u2014 or use the search box. Search is <strong>separator-insensitive</strong> (<code>test 123</code> finds <code>test123</code>) and understands <strong>scoped terms</strong>: <code>tag:</code>, <code>role:</code>, <code>name:</code>, <code>account:</code>, <code>env:</code>, <code>type:</code>, <code>org:</code>. Combine them with a space (<em>and</em>), a comma (<em>or</em>) or a leading <code>-</code> (<em>exclude</em>), with <code>"quotes"</code> for an exact phrase. Focus the box and it pops out with click-to-insert suggestions and a live match count. Star a role to favorite it; the <em>Favorites</em> and <em>Recent</em> chips re-filter quickly. Press <kbd>Esc</kbd> to clear every filter and the search at once.')}
          ${o("Account tags","Tag accounts with your own labels \u2014 <code>palo-alto</code>, <code>prod-network</code>, a ticket number \u2014 and organise by them. Click the small <strong>tag chip</strong> on any row to add or remove tags inline (autocompleting from tags you already use), or edit in bulk via <em>Account Tags</em> in the side menu. Tags get a filter row of their own and are searchable with <code>tag:</code>.")}
          ${o("Save a search as a Shortcut","Built a query and filter set you'll want again? Click <strong>\u2606 save as shortcut</strong> in the search card and name it \u2014 it becomes a chip in the <em>Shortcuts</em> row, and one click re-applies the whole view (search <em>and</em> filters). Remove one with its <strong>\u2715</strong> \u2014 click to arm, click again to confirm.")}
          ${o("Launch Sets","Open every console a ticket needs in one click. Search for the ticket (or filter to its accounts) and click <strong>\u2197 save as set</strong> in the search card \u2014 or use <strong>+ New set</strong> in the <em>Sets</em> column, which can also save the <strong>console tabs you have open</strong>. Each tab keeps its own role, service and region, and one role can have several tabs (EC2 and IAM side by side): click a set's name, then <strong>Edit</strong>. <strong>Open</strong> signs every tab in at once, next to this page, gathered in a Chrome tab group named after the set. Sensitive roles, roles missing from today's list and AWS's five-session limit get one confirmation for the whole set.")}
          ${o("Start view","Have the picker open on a view every load. Open <em>Start View</em> in the side menu and pick one chip \u2014 <strong>\u2605 Favorites</strong>, <strong>\u21BB Recent</strong>, one of your saved <em>Shortcuts</em>, or a <em>Tag</em>. The active choice is highlighted; <strong>Save current filters</strong> snapshots whatever you have on right now, and <strong>Clear</strong> removes it (your favorites stay put).")}
          ${o("Reorder by drag","Drag any role row to reposition it; the order persists across sessions. <strong>Reorder is disabled while any filter or search is active</strong> \u2014 otherwise you'd only be sorting visible rows, which gives surprising results. Clear filters first. <em>Reset Order</em> in the side menu restores AWS's default order.")}
          ${o("Deep-link into a service","Each role row has a service dropdown (EC2 / S3 / IAM / \u2026). Picking a service before <strong>Sign In</strong> drops you straight into that service's console for that role. Edit the list via <em>Services</em>.")}
          ${o("Pick a region per sign-in","Next to the service dropdown, each row has a region dropdown that sets which AWS region the sign-in lands in. It defaults to your region (set in <em>General Settings</em>) and remembers your last pick per role. Prefer every row to always open on the same region? Untick <strong>Remember the region I pick per role</strong> in <em>General Settings</em> \u2014 rows and the Jump bar then always start on your default region, and you can still override any single sign-in from its dropdown. Edit which regions appear \u2014 and their order \u2014 via <em>Regions</em>.")}
          ${o("Jump to account (role chaining)","For accounts you can only reach by <strong>assuming a role from a hub</strong>. Configure your orgs once via <em>Jump Profiles</em> in the side menu (one per line: <code>Org name | hub account id | role to assume | region</code>; the region is optional, and the hub may name its own role as <code>id/HubRole</code> when that account has more than one) \u2014 a <strong>\u2933 Jump to account</strong> button then appears in the search column. Pick the org, type the 12-digit destination account, choose the region to land in (defaults to your General Settings region, and remembers your last jump), optionally add a session label, and Jump: Console Hopper signs into the hub and opens AWS's Switch Role pre-filled \u2014 one click there and you're in, in the region you picked rather than whichever one AWS defaults that account to. The new console tab is titled with your session label, and your last jumps are one click away in the popover (<strong>\u2715</strong> forgets one). The popover stays deliberately small \u2014 a quick way in, with <em>Save as a named destination</em> to keep a place; saved destinations live as <strong>\u2933 rows in the listing</strong> and are curated under <em>Jump Destinations</em>. When you have more than one console session open, AWS interrupts the jump to ask which one to switch from \u2014 and it doesn't reliably pre-select the right one, which is what causes \u201Cthe selected session doesn't have permission to switch to that role\u201D. Console Hopper picks the hub session and submits the pre-filled form for you, so a jump stays one click. It only does this during a jump you started, only when exactly one session matches the hub, and only for the destination you typed; anything ambiguous is left untouched for you to decide. Note: the hub must be in your current role list, the hub\u2192target trust must already exist in AWS, and chained sessions are capped at 1 hour by AWS. Save the places you jump to often as <strong>Jump Destinations</strong> (side menu, or the <em>Save as a named destination</em> tick in the popover) \u2014 each becomes a <strong>\u2933 row in the listing</strong>, searchable, taggable and favouritable like any row, with its own landing Service and Region picks; a <em>Source</em> filter row and <code>is:jump</code> in search show only them, and a row greys out when its hub role isn't in today's list.")}
          ${o("Active AWS sessions","AWS allows <strong>5 concurrent console sessions</strong> per browser profile, and normally only tells you once you've hit the wall. A counter sits at the bottom of the right column \u2014 it turns amber with one slot left and red when you're full. Click it for the full list, oldest first: the session label you gave the jump, account and role, which <strong>region</strong> and <strong>tab group</strong> its tabs are in, when it started, <strong>how long until it expires</strong>, and how many tabs it still has open. <strong>\u2715</strong> signs an individual session out (click twice to confirm) so you can free a slot without leaving the picker \u2014 the session you signed in with is marked <em>you</em> and can't be closed from here. <em>Clear AWS sessions</em> in the side menu still signs them all out at once. Console Hopper only reads session metadata \u2014 never cookie contents.")}
          ${o("Rename accounts","Give specific accounts a friendlier name via <em>Account Names</em> (one per line, e.g. <code>123456789012: Prod Logging</code>). The custom name <strong>replaces</strong> the AWS account name in the list and is used for filtering, grouping and tab titles. Saving updates the list immediately. Tip: click the <strong>account-ID button</strong> on any row to copy the 12-digit id.")}
          ${o("Sign in your way","A plain <strong>Sign In</strong> opens the console in the same tab or a new one \u2014 your choice, set via the <em>Sign-in</em> side-menu option. <strong>\u2318/Ctrl-click</strong> or <strong>middle-click</strong> always does the opposite, so both are one click away.")}
          ${o("Coloured console tabs","Each open AWS console tab gets a coloured favicon (env color) and a tab-title prefix with the account name, so 10 open tabs are still distinguishable at a glance.")}
          ${o("Tab groups (visual containers)","Chrome tab groups cluster console tabs by role, by organisation, or by a ticket tag \u2014 emulates Firefox containers visually. Choose how from the <strong>Tabs:</strong> dropdown in the search column \u2014 <em>By role</em>, <em>By org</em>, <em>Custom tag</em> (type a ticket or workstream to group everything under it), or <em>Off</em>. The <em>Tab Groups</em> side-menu entry explains the modes and stays in sync.")}
          ${o("Clear AWS sessions","<em>Clear AWS Sessions</em> in the side menu signs you out of your AWS console sessions in one click by deleting AWS authentication cookies (cookies only \u2014 your favorites and settings are kept). It asks for confirmation first.")}
          ${o("Make it yours","Open the side menu (hover the right edge) to manage <em>Organizations</em>, <em>Environments</em>, <em>Account Types</em>, <em>Role Names</em>, <em>Services</em>, <em>Regions</em>, <em>Account Names</em>, and <em>General Settings</em> (default region, sensitive-sign-in triggers, footer URL). Defaults ship as generic placeholders \u2014 rename them to match your org.")}
          ${o("Privacy",'Everything stays in your browser. Nothing is sent to any server by this extension. Use <em>Export Settings</em> to share your config with a teammate. <a href="https://github.com/tomekklas/console-hopper/blob/main/PRIVACY.md" target="_blank" rel="noopener" style="color:#0073bb !important; text-decoration: underline !important;">Read the full privacy policy</a>.')}
          <div style="margin-top: 18px !important; text-align: right !important;">
            <button data-action="ok" type="button" style="
                padding: 8px 18px !important;
                border: 1px solid #0073bb !important;
                background: #0073bb !important;
                color: white !important;
                border-radius: 4px !important;
                cursor: pointer !important;
                font-weight: 600 !important;
            ">${t?"Got it":"Close"}</button>
          </div>
        </div>
      </div>
    `;i("body").append(n);let a=i("#tm_about_modal");t&&k.saveWelcomeSeen(!0);let s=()=>a.remove();a.on("click",function(l){l.target===this&&s()}),a.find('[data-action="ok"]').on("click",s)};i("body").on("click","#tm_about",function(t){t.preventDefault(),un({firstRun:!1})}),i("body").on("click","#tm_keyboard_help",function(t){t.preventDefault();let e=/Mac/i.test(navigator.platform),o=e?"\u2318":"Ctrl",n=e?"\u2325":"Alt",a=`
      <div id="tm_kb_help_modal" style="
          position: fixed !important;
          top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
          background: rgba(0,0,0,0.5) !important;
          z-index: 10000 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
      ">
        <div style="
            background: white !important;
            border-radius: 8px !important;
            padding: 22px 24px !important;
            max-width: 460px !important;
            width: 90% !important;
        ">
          <h3 style="margin: 0 0 14px 0 !important; color: #16191f !important;">Keyboard Shortcuts</h3>
          <table style="width: 100% !important; border-collapse: collapse !important; font-size: 13px !important;">
            <tr><td style="padding: 6px 0 !important;"><kbd>/</kbd>, <kbd>${o}</kbd>+<kbd>K</kbd> or tap <kbd>${n}</kbd></td><td style="padding: 6px 0 !important; color: #6c757d !important;">Focus the search box</td></tr>
            <tr><td style="padding: 6px 0 !important;"><kbd>\u2191</kbd> / <kbd>\u2193</kbd></td><td style="padding: 6px 0 !important; color: #6c757d !important;">Move selection through visible roles</td></tr>
            <tr><td style="padding: 6px 0 !important;"><kbd>${n}</kbd>+<kbd>\u2191</kbd><kbd>\u2193</kbd><kbd>\u2190</kbd><kbd>\u2192</kbd></td><td style="padding: 6px 0 !important; color: #6c757d !important;">Move through search suggestions (<kbd>Enter</kbd> adds the highlighted one)</td></tr>
            <tr><td style="padding: 6px 0 !important;"><kbd>Enter</kbd></td><td style="padding: 6px 0 !important; color: #6c757d !important;">Sign in to the selected role</td></tr>
            <tr><td style="padding: 6px 0 !important;"><kbd>${o}</kbd>+<kbd>Enter</kbd></td><td style="padding: 6px 0 !important; color: #6c757d !important;">Sign in, toggling new-tab vs. your default (also: ${o}-click / middle-click)</td></tr>
            <tr><td style="padding: 6px 0 !important;"><kbd>Esc</kbd></td><td style="padding: 6px 0 !important; color: #6c757d !important;">Close modal / clear selection / clear filters</td></tr>
          </table>
          <div style="margin-top: 18px !important; text-align: right !important;">
            <button data-action="close" style="
                padding: 8px 16px !important;
                border: 1px solid #0073bb !important;
                background: #0073bb !important;
                color: white !important;
                border-radius: 4px !important;
                cursor: pointer !important;
            ">Got it</button>
          </div>
        </div>
      </div>
    `;i("body").append(a);let s=i("#tm_kb_help_modal"),l=()=>s.remove();s.on("click",function(m){m.target===this&&l()}),s.find('[data-action="close"]').on("click",l)});let Oe=()=>{i("#tm_tab_group_mode").text(`Tab Groups: ${r.TAB_GROUP_MODE_LABELS[st]||"By role"}`)},St=(t,e)=>{let o=document.getElementById(t),n=document.getElementById(e);!o||!n||n.classList.toggle("tm_has_value",!!o.value)},ge=()=>St("tm_group_tag_input","tm_group_tag_field"),_n=()=>{let t=document.getElementById("tm_group_mode_select"),e=document.getElementById("tm_group_tag_input"),o=document.getElementById("tm_group_tag_field");!t||!e||!o||(st==="custom"?(t.value="custom",e.value=it,o.style.display="block"):(t.value=r.TAB_GROUP_MODES.includes(st)?st:"role",e.value="",o.style.display="none"),ge())};i("body").on("click","#tm_tab_group_mode",function(t){t.preventDefault(),Hr()});let Hr=()=>{let t=st,e=(s,l,m)=>`
        <label style="display: flex !important; gap: 10px !important; align-items: flex-start !important; padding: 10px 12px !important; border: 1px solid #e1e4e8 !important; border-radius: 6px !important; margin-bottom: 8px !important; cursor: pointer !important;">
          <input type="radio" name="tm_tab_group_mode_choice" value="${s}" ${s===t?"checked":""} style="margin: 4px 0 0 0 !important;" />
          <span style="flex: 1 !important;">
            <span style="display: block !important; font-weight: 600 !important; color: #16191f !important; font-size: 14px !important;">${l}</span>
            <span style="display: block !important; color: #6c757d !important; font-size: 12px !important; margin-top: 2px !important;">${m}</span>
          </span>
        </label>
      `,o=`
      <div id="tm_tab_group_mode_modal" style="
          position: fixed !important;
          top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
          background: rgba(0,0,0,0.5) !important;
          z-index: 10000 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
      ">
        <div style="
            background: white !important;
            border-radius: 8px !important;
            padding: 22px 24px !important;
            max-width: 560px !important;
            width: 92% !important;
            max-height: 88vh !important;
            overflow-y: auto !important;
        ">
          <h3 style="margin: 0 0 8px 0 !important; color: #16191f !important;">Tab Groups</h3>
          <p style="margin: 0 0 8px 0 !important; color: #6c757d !important; font-size: 13px !important; line-height: 1.45 !important;">
            When you click <strong>Sign In</strong>, this plugin can drop the
            resulting AWS console tab into a Chrome <strong>tab group</strong>
            so your open sessions are visually clustered and colour-coded in
            the tab strip. Groups are purely visual \u2014 they don't isolate
            cookies or sessions.
          </p>
          <p style="margin: 0 0 14px 0 !important; color: #6c757d !important; font-size: 12px !important; line-height: 1.45 !important;">
            You can also set this \u2014 including a one-off <em>Custom tag</em> that
            groups tabs by ticket id or workstream regardless of account \u2014 from
            the <em>Tabs:\u2026</em> dropdown in the same column as the account
            search, without opening this dialog.
          </p>
          ${e("role","By role","Each unique account + role becomes its own coloured group, e.g. <code>my-account \xB7 PowerUser</code>. Same role always gets the same colour.")}
          ${e("org","By org","Accounts cluster by organization, based on your <em>Organizations</em> patterns. Accounts that don't match any org are not grouped.")}
          ${e("off","Off","No automatic grouping. Tab title prefix and favicon colouring still apply.")}
          <div style="margin-top: 14px !important; text-align: right !important;">
            <button data-action="cancel" style="
                padding: 8px 16px !important;
                margin-right: 10px !important;
                border: 1px solid #ccc !important;
                background: white !important;
                border-radius: 4px !important;
                cursor: pointer !important;
            ">Cancel</button>
            <button data-action="save" style="
                padding: 8px 16px !important;
                border: 1px solid #0073bb !important;
                background: #0073bb !important;
                color: white !important;
                border-radius: 4px !important;
                cursor: pointer !important;
                font-weight: 600 !important;
            ">Save</button>
          </div>
        </div>
      </div>
    `;i("body").append(o);let n=i("#tm_tab_group_mode_modal"),a=()=>n.remove();n.on("click",function(s){s.target===this&&a()}),n.find('[data-action="cancel"]').on("click",a),n.find('[data-action="save"]').on("click",async function(){let s=n.find('input[name="tm_tab_group_mode_choice"]:checked').val();if(!s||!r.TAB_GROUP_MODES.includes(s)){a();return}st=s,await k.saveTabGroupMode(s),Oe(),it&&(it="",await k.saveTabGroupTag("")),_n(),a(),S(`Tab grouping: ${r.TAB_GROUP_MODE_LABELS[s]}`,"success",r.TOAST_DURATION)})},Kr=()=>{let t=Qt?"new":"same",e=(s,l,m)=>`
        <label style="display: flex !important; gap: 10px !important; align-items: flex-start !important; padding: 10px 12px !important; border: 1px solid #e1e4e8 !important; border-radius: 6px !important; margin-bottom: 8px !important; cursor: pointer !important;">
          <input type="radio" name="tm_signin_tab_choice" value="${s}" ${s===t?"checked":""} style="margin: 4px 0 0 0 !important;" />
          <span style="flex: 1 !important;">
            <span style="display: block !important; font-weight: 600 !important; color: #16191f !important; font-size: 14px !important;">${l}</span>
            <span style="display: block !important; color: #6c757d !important; font-size: 12px !important; margin-top: 2px !important;">${m}</span>
          </span>
        </label>
      `,o=`
      <div id="tm_signin_tab_modal" style="
          position: fixed !important;
          top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
          background: rgba(0,0,0,0.5) !important;
          z-index: 10000 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
      ">
        <div style="
            background: white !important;
            border-radius: 8px !important;
            padding: 22px 24px !important;
            max-width: 560px !important;
            width: 92% !important;
            max-height: 88vh !important;
            overflow-y: auto !important;
        ">
          <h3 style="margin: 0 0 8px 0 !important; color: #16191f !important;">Sign-in tab</h3>
          <p style="margin: 0 0 8px 0 !important; color: #6c757d !important; font-size: 13px !important; line-height: 1.45 !important;">
            Choose where clicking <strong>Sign In</strong> opens the AWS console.
          </p>
          <p style="margin: 0 0 14px 0 !important; color: #6c757d !important; font-size: 12px !important; line-height: 1.45 !important;">
            <strong>Tip:</strong> to do the opposite for just one sign-in, hold
            <strong>\u2318/Ctrl</strong> (or middle-click) when you click Sign In \u2014
            no need to change this setting. (If you use the keyboard, \u2318/Ctrl +
            Enter does the same.)
          </p>
          ${e("same","Same tab","Sign In replaces the current tab (the role picker). This is the default.")}
          ${e("new","New tab","Sign In opens the console in a new tab and leaves the role picker open, so you can sign into several roles in a row.")}
          <div style="margin-top: 14px !important; text-align: right !important;">
            <button data-action="cancel" style="
                padding: 8px 16px !important;
                margin-right: 10px !important;
                border: 1px solid #ccc !important;
                background: white !important;
                border-radius: 4px !important;
                cursor: pointer !important;
            ">Cancel</button>
            <button data-action="save" style="
                padding: 8px 16px !important;
                border: 1px solid #0073bb !important;
                background: #0073bb !important;
                color: white !important;
                border-radius: 4px !important;
                cursor: pointer !important;
                font-weight: 600 !important;
            ">Save</button>
          </div>
        </div>
      </div>
    `;i("body").append(o);let n=i("#tm_signin_tab_modal"),a=()=>n.remove();n.on("click",function(s){s.target===this&&a()}),n.find('[data-action="cancel"]').on("click",a),n.find('[data-action="save"]').on("click",async function(){let l=n.find('input[name="tm_signin_tab_choice"]:checked').val()==="new";await be.saveSetting(l)&&(be.updateButton(),a(),S(`Sign-in opens in ${l?"a new tab":"the same tab"}`,"success",r.TOAST_DURATION))})},Br=_(t=>k.saveTabGroupTag(t),300);i("body").on("input","#tm_group_tag_input",function(){it=i(this).val().trim(),Br(it),ge()}),i("body").on("click","#tm_group_tag_clear",async function(t){t.preventDefault();let e=document.getElementById("tm_group_tag_input");e&&(e.value=""),it="",await k.saveTabGroupTag(""),ge(),e&&e.focus()}),i("body").on("change","#tm_group_mode_select",async function(){let t=String(i(this).val()||""),e=document.getElementById("tm_group_tag_input"),o=document.getElementById("tm_group_tag_field");if(t==="custom"){st="custom",await k.saveTabGroupMode("custom"),Oe(),o&&(o.style.display="block"),e&&e.focus(),ge();return}r.TAB_GROUP_MODES.includes(t)&&(st=t,await k.saveTabGroupMode(t),Oe(),it&&(it="",await k.saveTabGroupTag("")),e&&(e.value=""),o&&(o.style.display="none"),ge())}),i("body").on("click","#tm_reset_order",function(t){t.preventDefault(),i("body").append(`
      <div id="tm_reset_order_modal" style="
          position: fixed !important;
          top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
          background: rgba(0,0,0,0.55) !important;
          z-index: 10001 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
      ">
        <div style="
            background: white !important;
            border-radius: 8px !important;
            padding: 22px 24px !important;
            max-width: 440px !important;
            width: 90% !important;
            border-top: 6px solid #dc3545 !important;
            box-shadow: 0 8px 32px rgba(0,0,0,0.25) !important;
        ">
          <h3 style="margin: 0 0 10px 0 !important; color: #16191f !important;">
            Reset role order?
          </h3>
          <p style="margin: 0 0 16px 0 !important; color: #6c757d !important; font-size: 13px !important;">
            This clears your drag-and-drop ordering and restores AWS's default
            order. This cannot be undone.
          </p>
          <div style="text-align: right !important;">
            <button data-action="cancel" style="
                padding: 8px 16px !important;
                margin-right: 10px !important;
                border: 1px solid #ccc !important;
                background: white !important;
                border-radius: 4px !important;
                cursor: pointer !important;
            ">Cancel</button>
            <button data-action="reset" style="
                padding: 8px 16px !important;
                border: 1px solid #dc3545 !important;
                background: #dc3545 !important;
                color: white !important;
                border-radius: 4px !important;
                cursor: pointer !important;
                font-weight: 600 !important;
            ">Reset</button>
          </div>
        </div>
      </div>
    `);let o=i("#tm_reset_order_modal"),n=()=>o.remove();o.on("click",function(a){a.target===this&&n()}),o.find('[data-action="cancel"]').on("click",n),o.find('[data-action="reset"]').on("click",async function(){await k.saveRoleOrder([]),Pt=[],n(),S("Order reset \u2014 reloading\u2026","success",r.TOAST_DURATION),setTimeout(()=>location.reload(),600)})}),i("body").on("click","#tm_reset_recent",function(t){t.preventDefault(),i("body").append(`
      <div id="tm_reset_recent_modal" style="
          position: fixed !important;
          top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
          background: rgba(0,0,0,0.55) !important;
          z-index: 10001 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
      ">
        <div style="
            background: white !important;
            border-radius: 8px !important;
            padding: 22px 24px !important;
            max-width: 440px !important;
            width: 90% !important;
            border-top: 6px solid #dc3545 !important;
            box-shadow: 0 8px 32px rgba(0,0,0,0.25) !important;
        ">
          <h3 style="margin: 0 0 10px 0 !important; color: #16191f !important;">
            Clear recent sign-ins?
          </h3>
          <p style="margin: 0 0 16px 0 !important; color: #6c757d !important; font-size: 13px !important;">
            This empties the <em>Recent</em> shortcut list. Sign-ins from now
            on will start populating it again. This cannot be undone.
          </p>
          <div style="text-align: right !important;">
            <button data-action="cancel" style="
                padding: 8px 16px !important;
                margin-right: 10px !important;
                border: 1px solid #ccc !important;
                background: white !important;
                border-radius: 4px !important;
                cursor: pointer !important;
            ">Cancel</button>
            <button data-action="reset" style="
                padding: 8px 16px !important;
                border: 1px solid #dc3545 !important;
                background: #dc3545 !important;
                color: white !important;
                border-radius: 4px !important;
                cursor: pointer !important;
                font-weight: 600 !important;
            ">Clear</button>
          </div>
        </div>
      </div>
    `);let o=i("#tm_reset_recent_modal"),n=()=>o.remove();o.on("click",function(a){a.target===this&&n()}),o.find('[data-action="cancel"]').on("click",n),o.find('[data-action="reset"]').on("click",async function(){mt=[],await k.saveRecentRoles([]),n(),K.applyFilters(),S("Recent cleared","success",r.TOAST_DURATION)})});let gn=Object.values(r.STORAGE_KEYS),po=new Set([r.STORAGE_KEYS.FAVORITES,r.STORAGE_KEYS.SHORTCUTS,r.STORAGE_KEYS.SERVICES,r.STORAGE_KEYS.REGION_LIST,r.STORAGE_KEYS.ENV_PATTERNS,r.STORAGE_KEYS.ORG_PATTERNS,r.STORAGE_KEYS.TYPE_PATTERNS,r.STORAGE_KEYS.ROLE_PATTERNS,r.STORAGE_KEYS.RECENT_ROLES,r.STORAGE_KEYS.ROLE_ORDER,r.STORAGE_KEYS.SIGNIN_CONFIRM_ROLE_KEYWORDS,r.STORAGE_KEYS.SIGNIN_CONFIRM_TYPE_IDS,r.STORAGE_KEYS.ASSUME_PROFILES,r.STORAGE_KEYS.JUMP_RECENTS,r.STORAGE_KEYS.JUMP_PINNED,r.STORAGE_KEYS.JUMP_DESTS]),Yr=async()=>{let t=await chrome.storage.local.get(gn),e={};for(let[o,n]of Object.entries(t))if(po.has(o)&&typeof n=="string")try{e[o]=JSON.parse(n)}catch{e[o]=n}else e[o]=n;return{_meta:{plugin:"Console Hopper",version:r.SCRIPT_VERSION,exportedAt:new Date().toISOString()},settings:e}};i("body").on("click","#tm_export_settings",async function(t){t.preventDefault();let e=await Yr(),o=JSON.stringify(e,null,2);i("body").append(`
      <div id="tm_export_modal" style="
          position: fixed !important;
          top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
          background: rgba(0,0,0,0.5) !important;
          z-index: 10000 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
      ">
        <div style="
            background: white !important;
            border-radius: 8px !important;
            padding: 20px !important;
            max-width: 640px !important;
            width: 92% !important;
            max-height: 85vh !important;
            overflow-y: auto !important;
        ">
          <h3 style="margin: 0 0 8px 0 !important; color: #16191f !important;">Export Settings</h3>
          <p style="margin: 0 0 12px 0 !important; color: #6c757d !important; font-size: 13px !important;">
            Copy this JSON and paste it into another browser/profile via Import Settings to clone your setup.
          </p>
          <textarea id="tm_export_json" readonly style="
              width: 100% !important;
              height: 320px !important;
              border: 1px solid #ccc !important;
              border-radius: 4px !important;
              padding: 10px !important;
              font-family: monospace !important;
              font-size: 12px !important;
              resize: vertical !important;
              box-sizing: border-box !important;
              background: #f8f9fa !important;
          "></textarea>
          <div style="margin-top: 15px !important; text-align: right !important;">
            <button data-action="copy" style="
                padding: 8px 16px !important;
                margin-right: 10px !important;
                border: 1px solid #0073bb !important;
                background: white !important;
                color: #0073bb !important;
                border-radius: 4px !important;
                cursor: pointer !important;
            ">Copy</button>
            <button data-action="download" style="
                padding: 8px 16px !important;
                margin-right: 10px !important;
                border: 1px solid #0073bb !important;
                background: white !important;
                color: #0073bb !important;
                border-radius: 4px !important;
                cursor: pointer !important;
            ">Download</button>
            <button data-action="close" style="
                padding: 8px 16px !important;
                border: 1px solid #0073bb !important;
                background: #0073bb !important;
                color: white !important;
                border-radius: 4px !important;
                cursor: pointer !important;
            ">Close</button>
          </div>
        </div>
      </div>
    `);let a=i("#tm_export_modal");i("#tm_export_json").val(o);let s=()=>a.remove();a.on("click",function(l){l.target===this&&s()}),a.find('[data-action="close"]').on("click",s),a.find('[data-action="copy"]').on("click",async function(){let l=await $o(o);S(l?"Settings copied to clipboard":"Copy failed",l?"success":"error",r.TOAST_DURATION)}),a.find('[data-action="download"]').on("click",function(){let l=new Blob([o],{type:"application/json"}),m=URL.createObjectURL(l),h=document.createElement("a");h.href=m,h.download=`console-hopper-settings-${new Date().toISOString().slice(0,10)}.json`,document.body.appendChild(h),h.click(),h.remove(),URL.revokeObjectURL(m)})}),i("body").on("click","#tm_import_settings",function(t){t.preventDefault(),i("body").append(`
      <div id="tm_import_modal" style="
          position: fixed !important;
          top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
          background: rgba(0,0,0,0.5) !important;
          z-index: 10000 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
      ">
        <div style="
            background: white !important;
            border-radius: 8px !important;
            padding: 20px !important;
            max-width: 640px !important;
            width: 92% !important;
            max-height: 85vh !important;
            overflow-y: auto !important;
        ">
          <h3 style="margin: 0 0 8px 0 !important; color: #16191f !important;">Import Settings</h3>
          <p style="margin: 0 0 12px 0 !important; color: #6c757d !important; font-size: 13px !important;">
            Paste an export JSON. Only the recognised settings keys are imported; everything else is ignored. Existing settings for those keys will be overwritten. The page reloads after import.
          </p>
          <textarea id="tm_import_json" placeholder='{ "_meta": { ... }, "settings": { ... } }' style="
              width: 100% !important;
              height: 320px !important;
              border: 1px solid #ccc !important;
              border-radius: 4px !important;
              padding: 10px !important;
              font-family: monospace !important;
              font-size: 12px !important;
              resize: vertical !important;
              box-sizing: border-box !important;
          "></textarea>
          <div style="margin-top: 15px !important; text-align: right !important;">
            <button data-action="cancel" style="
                padding: 8px 16px !important;
                margin-right: 10px !important;
                border: 1px solid #ccc !important;
                background: white !important;
                border-radius: 4px !important;
                cursor: pointer !important;
            ">Cancel</button>
            <button data-action="import" style="
                padding: 8px 16px !important;
                border: 1px solid #0073bb !important;
                background: #0073bb !important;
                color: white !important;
                border-radius: 4px !important;
                cursor: pointer !important;
            ">Import</button>
          </div>
        </div>
      </div>
    `);let o=i("#tm_import_modal"),n=()=>o.remove();o.on("click",function(a){a.target===this&&n()}),o.find('[data-action="cancel"]').on("click",n),o.find('[data-action="import"]').on("click",async function(){let a=i("#tm_import_json").val(),s;try{s=JSON.parse(a)}catch(f){S("Invalid JSON: "+f.message,"error",r.TOAST_DURATION_LONG);return}let l=s&&s.settings?s.settings:s;if(!l||typeof l!="object"){S("No settings object found in JSON","error",r.TOAST_DURATION_LONG);return}let m=f=>typeof f=="string"&&/^#[0-9a-fA-F]{3,8}$/.test(f),h=f=>Array.isArray(f)&&f.every(b=>typeof b=="string"),T=f=>Array.isArray(f)&&f.every(b=>b&&typeof b=="object"&&typeof b.id=="string"&&b.id.length<=64&&typeof b.label=="string"&&b.label.length<=64&&(b.color==null||m(b.color))&&(b.patterns==null||h(b.patterns))),w=f=>Array.isArray(f)&&f.every(b=>b&&typeof b=="object"&&typeof b.id=="string"&&typeof b.name=="string"&&b.name.length<=64&&typeof b.path=="string"&&b.path.length<=256),R=f=>Array.isArray(f)&&f.every(b=>b&&typeof b=="object"&&typeof b.id=="string"&&b.id.length<=32&&(b.label===void 0||typeof b.label=="string"&&b.label.length<=64)),x=f=>Array.isArray(f)&&f.every(b=>b&&typeof b=="object"&&typeof b.roleArn=="string"),y=f=>f&&typeof f=="object"&&!Array.isArray(f)&&Object.values(f).every(b=>typeof b=="string"),d=f=>f&&typeof f=="object"&&!Array.isArray(f)&&Object.values(f).every(b=>Array.isArray(b)&&b.every(D=>typeof D=="string")),g=r.STORAGE_KEYS,O={[g.THEME]:f=>typeof f=="string"&&["light","dark","auto"].includes(f),[g.FAVORITES]:h,[g.SHORTCUTS]:f=>Array.isArray(f)&&f.every(b=>b&&typeof b=="object"&&typeof b.label=="string"&&b.label.length<=64&&typeof b.search=="string"&&b.search.length<=256),[g.COMPACT_MODE]:f=>typeof f=="boolean",[g.REMEMBER_REGION]:f=>typeof f=="boolean",[g.REGION_LOCK]:f=>typeof f=="boolean",[g.SIGNIN_NEW_TAB]:f=>typeof f=="boolean",[g.SERVICES]:w,[g.LAST_SERVICE]:y,[g.LAST_REGION]:f=>y(f)&&Object.values(f).every(b=>ht(b)),[g.REGION_LIST]:R,[g.ACCOUNT_NAMES]:y,[g.ACCOUNT_TAGS]:d,[g.ENV_PATTERNS]:T,[g.ORG_PATTERNS]:T,[g.TYPE_PATTERNS]:T,[g.ROLE_PATTERNS]:T,[g.RECENT_ROLES]:x,[g.RECENT_LIMIT]:f=>typeof f=="number"&&f>=1&&f<=100,[g.ROLE_ORDER]:h,[g.TAB_GROUP_TAG]:f=>typeof f=="string"&&f.length<=64,[g.TAB_GROUP_MODE]:f=>r.TAB_GROUP_MODES.includes(f),[g.AWS_REGION]:f=>typeof f=="string"&&ht(f),[g.HOMEPAGE_URL]:f=>typeof f=="string"&&f.length<=512&&(f.trim()===""||no(f)),[g.SIGNIN_CONFIRM_ROLE_KEYWORDS]:h,[g.SIGNIN_CONFIRM_TYPE_IDS]:h,[g.WELCOME_SEEN]:f=>typeof f=="boolean",[g.START_VIEW]:f=>!!f&&typeof f=="object"&&!Array.isArray(f)&&!!f.filters&&typeof f.filters=="object"&&!Array.isArray(f.filters)&&(f.search===void 0||typeof f.search=="string"),[g.ASSUME_PROFILES]:f=>Array.isArray(f)&&f.every(b=>b&&typeof b=="object"&&typeof b.name=="string"&&b.name.length<=64&&typeof b.hub=="string"&&/^\d{12}$/.test(b.hub)&&typeof b.role=="string"&&b.role.length<=128),[g.JUMP_DESTS]:f=>Array.isArray(f)&&f.length<=100&&f.every(b=>b&&typeof b=="object"&&typeof b.account=="string"&&/^\d{12}$/.test(b.account)&&typeof b.profile=="string"&&b.profile.length>0&&b.profile.length<=64&&(b.name===void 0||typeof b.name=="string"&&b.name.length<=64)&&(b.label===void 0||typeof b.label=="string"&&b.label.length<=120)&&(b.region===void 0||b.region===""||typeof b.region=="string"&&ht(b.region))&&(b.service===void 0||typeof b.service=="string"&&Vt(b.service))),[g.LAUNCH_SETS]:f=>Array.isArray(f)&&f.length<=ko&&he(f).length===f.length&&he(f).every((b,D)=>b.tabs.length===f[D].tabs.length&&b.tabs.every((J,et)=>J.service===(f[D].tabs[et].service||"")&&J.region===(f[D].tabs[et].region||""))),[g.JUMP_RECENTS]:f=>Array.isArray(f)&&f.every(b=>b&&typeof b=="object"&&typeof b.org=="string"&&typeof b.account=="string"&&(b.label===void 0||typeof b.label=="string")&&(b.role===void 0||typeof b.role=="string")),[g.JUMP_PINNED]:f=>Array.isArray(f)&&f.every(b=>b&&typeof b=="object"&&typeof b.org=="string"&&typeof b.account=="string"&&(b.label===void 0||typeof b.label=="string")&&(b.role===void 0||typeof b.role=="string"))},N=new Set(gn),M={},j=[],L=0;for(let[f,b]of Object.entries(l)){if(!N.has(f))continue;let D=b;if(po.has(f)&&typeof b=="string")try{D=JSON.parse(b)}catch{j.push(f);continue}let J=O[f];if(!J||!J(D)){j.push(f);continue}M[f]=po.has(f)?JSON.stringify(D):D,L++}if(L===0){S("No valid settings found in the JSON","error",r.TOAST_DURATION_LONG);return}j.length>0&&console.warn("Rejected malformed import keys:",j);try{await chrome.storage.local.set(M),n();let f=j.length?`Imported ${L} settings (${j.length} skipped) \u2014 reloading\u2026`:`Imported ${L} settings \u2014 reloading\u2026`;S(f,"success",r.TOAST_DURATION),setTimeout(()=>location.reload(),800)}catch(f){S("Storage write failed: "+f.message,"error",r.TOAST_DURATION_LONG)}})}),i("body").on("click","#tm_recent_limit",function(t){t.preventDefault();let o=`
      <div id="tm_recent_modal" style="
          position: fixed !important;
          top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
          background: rgba(0,0,0,0.5) !important;
          z-index: 10000 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
      ">
        <div style="
            background: white !important;
            border-radius: 8px !important;
            padding: 20px !important;
            max-width: 420px !important;
            width: 90% !important;
        ">
          <h3 style="margin: 0 0 10px 0 !important; color: #16191f !important;">Recent Roles Limit</h3>
          <p style="margin: 0 0 14px 0 !important; color: #6c757d !important; font-size: 13px !important;">
            How many recent roles to remember and show under the Recent filter? (1\u2013100)
          </p>
          <input type="number" id="tm_recent_input" min="1" max="100" step="1" value="${$t.getLimit()}" style="
              width: 100% !important;
              border: 1px solid #ccc !important;
              border-radius: 4px !important;
              padding: 8px 10px !important;
              font-family: monospace !important;
              font-size: 14px !important;
              box-sizing: border-box !important;
          " />
          <div style="margin-top: 18px !important; text-align: right !important;">
            <button data-action="cancel" style="
                padding: 8px 16px !important;
                margin-right: 10px !important;
                border: 1px solid #ccc !important;
                background: white !important;
                border-radius: 4px !important;
                cursor: pointer !important;
            ">Cancel</button>
            <button data-action="save" style="
                padding: 8px 16px !important;
                border: 1px solid #0073bb !important;
                background: #0073bb !important;
                color: white !important;
                border-radius: 4px !important;
                cursor: pointer !important;
            ">Save</button>
          </div>
        </div>
      </div>
    `;i("body").append(o);let n=i("#tm_recent_modal"),a=()=>n.remove();n.on("click",function(s){s.target===this&&a()}),n.find('[data-action="cancel"]').on("click",a),setTimeout(()=>i("#tm_recent_input").trigger("focus").trigger("select"),0),n.find('[data-action="save"]').on("click",async function(){let s=i("#tm_recent_input").val();await $t.setLimit(s)&&(i("#tm_recent_limit").text(`Recent: ${$t.getLimit()}`),K.applyFilters(),a(),S(`Recent limit set to ${$t.getLimit()}`,"success",r.TOAST_DURATION))})});let $e=(t,e,o)=>{if(!C[t])return;let n=new Set(o.map(a=>a.id));C[t]=C[t].map(a=>e[a]||a).filter(a=>n.has(a))};i("body").on("click","#tm_manage_environments",function(t){t.preventDefault(),Ee({modalId:"tm_envs_modal",title:"Environments",description:"Each entry colors a filter button, the role-card left stripe, and the AWS console favicon. Patterns are substrings of the account name or full account IDs.",addButtonLabel:"Add environment",labelPlaceholder:"e.g. PROD",defaults:r.DEFAULT_ENV_PATTERNS,current:F.entries(),onSave:e=>F.save(e),onChangeIds:e=>$e("env",e,F.entries()),onAfterSave:()=>{Ct("env",F.entries()),de(),K.applyFilters()},toastOnSave:"Environments saved!"})}),i("body").on("click","#tm_manage_organizations",function(t){t.preventDefault(),Ee({modalId:"tm_orgs_modal",title:"Organizations",description:'Cluster accounts into organizations. Used by the toolbar filter row and by tab-group "By org" mode. Patterns are substrings of the account name or full account IDs.',addButtonLabel:"Add organization",labelPlaceholder:"e.g. ACME",defaults:r.DEFAULT_ORG_PATTERNS,current:pt.entries(),onSave:e=>pt.save(e),onChangeIds:e=>$e("org",e,pt.entries()),onAfterSave:()=>{Ct("org",pt.entries()),K.applyFilters()},toastOnSave:"Organizations saved!"})}),i("body").on("click","#tm_manage_types",function(t){t.preventDefault(),Ee({modalId:"tm_types_modal",title:"Account Types",description:'Define categories like Management, Security, Logging, Network \u2026 Patterns are substrings of the account name or full account IDs. Configured types can be flagged as "sensitive" in General Settings.',addButtonLabel:"Add account type",labelPlaceholder:"e.g. Security",defaults:r.DEFAULT_TYPE_PATTERNS,current:ot.entries(),onSave:e=>ot.save(e),onChangeIds:async e=>{$e("type",e,ot.entries()),Et=Et.map(o=>e[o]||o).filter(o=>ot.findEntry(o)),await k.saveSigninConfirmTypeIds(Et)},onAfterSave:()=>{Ct("type",ot.entries()),K.applyFilters()},toastOnSave:"Account types saved!"})}),i("body").on("click","#tm_general_settings",function(t){t.preventDefault();let e=ot.entries(),o=e.length===0?'<div style="color:#6c757d !important; font-size: 13px !important; padding: 6px 0 !important;">No account types configured yet. Add them via <em>Account Types</em>.</div>':e.map(l=>{let m=Et.includes(l.id)?"checked":"",h=l.color&&/^#[0-9a-fA-F]{3,8}$/.test(l.color)?l.color:"#6c757d";return`
            <label style="display: flex !important; align-items: center !important; gap: 8px !important; padding: 4px 0 !important; cursor: pointer !important;">
              <input type="checkbox" class="tm_signin_type_id" value="${v(l.id)}" ${m} />
              <span style="display:inline-block !important; width:10px !important; height:10px !important; border-radius:2px !important; background:${h} !important; border:1px solid rgba(0,0,0,0.1) !important;"></span>
              <span style="font-size: 13px !important; color: #16191f !important;">${v(l.label)}</span>
            </label>
          `}).join(""),n=`
      <div id="tm_general_settings_modal" style="
          position: fixed !important;
          top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
          background: rgba(0,0,0,0.5) !important;
          z-index: 10000 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
      ">
        <div style="
            background: white !important;
            border-radius: 8px !important;
            padding: 22px 24px !important;
            max-width: 560px !important;
            width: 92% !important;
            max-height: 88vh !important;
            overflow-y: auto !important;
        ">
          <h3 style="margin: 0 0 14px 0 !important; color: #16191f !important;">General Settings</h3>

          <label style="display: block !important; margin-bottom: 14px !important;">
            <span style="display: block !important; font-weight: 600 !important; color: #16191f !important; margin-bottom: 4px !important; font-size: 13px !important;">Default AWS region</span>
            <select id="tm_gs_region" style="
                width: 100% !important; height: 32px !important; padding: 4px 8px !important;
                border: 1px solid #ccc !important; border-radius: 4px !important;
                font-size: 13px !important; box-sizing: border-box !important; cursor: pointer !important;
            ">
              ${(()=>{let l=It||r.DEFAULT_AWS_REGION,m=Ft.slice();return m.some(h=>h.id===l)||m.unshift({id:l,label:l}),m.map(h=>`<option value="${v(h.id)}"${h.id===l?" selected":""}>${v(h.label)} (${v(h.id)})</option>`).join("")})()}
            </select>
            <span style="display: block !important; color: #6c757d !important; font-size: 12px !important; margin-top: 4px !important;">
              Only regions added under <em>Regions</em> are listed \u2014 add more there.
              Used as the sign-in destination region and the <code>{region}</code> placeholder in service paths.
            </span>
          </label>

          <label style="display: flex !important; align-items: flex-start !important; gap: 8px !important; margin-bottom: 14px !important; cursor: pointer !important;">
            <input type="checkbox" id="tm_gs_remember_region" ${Nt?"checked":""} style="margin-top: 2px !important;" />
            <span>
              <span style="display: block !important; font-weight: 600 !important; color: #16191f !important; font-size: 13px !important;">Remember the region I pick per role</span>
              <span style="display: block !important; color: #6c757d !important; font-size: 12px !important; margin-top: 2px !important;">
                A role's region dropdown reopens on whatever you last chose for it.
                Turn this off and every row \u2014 and the Jump bar \u2014 always starts on the
                default region above. Either way you can change any single sign-in
                from its own dropdown.
              </span>
            </span>
          </label>

          <label style="display: flex !important; align-items: flex-start !important; gap: 8px !important; margin-bottom: 14px !important; cursor: pointer !important;">
            <input type="checkbox" id="tm_gs_region_lock" ${qt?"checked":""} style="margin-top: 2px !important;" />
            <span>
              <span style="display: block !important; font-weight: 600 !important; color: #16191f !important; font-size: 13px !important;">Keep console tabs in their region</span>
              <span style="display: block !important; color: #6c757d !important; font-size: 12px !important; margin-top: 2px !important;">
                Some AWS consoles are account-wide and have no region of their own, so
                leaving one drops you into whatever region your AWS profile defaults to \u2014
                not the one you were working in. This sends the tab back.
                Changing region from AWS's own region picker still works: the tab follows
                you and stays there.
              </span>
            </span>
          </label>

          <label style="display: block !important; margin-bottom: 14px !important;">
            <span style="display: block !important; font-weight: 600 !important; color: #16191f !important; margin-bottom: 4px !important; font-size: 13px !important;">Homepage URL (footer link)</span>
            <input type="text" id="tm_gs_homepage" value="${nt(Gt)}" placeholder="https://your.docs/url (leave blank to hide)" style="
                width: 100% !important; height: 32px !important; padding: 4px 8px !important;
                border: 1px solid #ccc !important; border-radius: 4px !important;
                font-size: 13px !important; box-sizing: border-box !important;
            " />
          </label>

          <div style="margin-bottom: 14px !important;">
            <div style="font-weight: 600 !important; color: #16191f !important; margin-bottom: 4px !important; font-size: 13px !important;">Sensitive-sign-in role keywords</div>
            <input type="text" id="tm_gs_signin_keywords" value="${nt(Xt.join(", "))}" placeholder="admin, root, breakglass" style="
                width: 100% !important; height: 32px !important; padding: 4px 8px !important;
                border: 1px solid #ccc !important; border-radius: 4px !important;
                font-size: 13px !important; box-sizing: border-box !important;
            " />
            <span style="display: block !important; color: #6c757d !important; font-size: 12px !important; margin-top: 4px !important;">
              Comma-separated. Signing in to a role whose name contains any of these pops a confirmation modal.
            </span>
          </div>

          <div style="margin-bottom: 6px !important;">
            <div style="font-weight: 600 !important; color: #16191f !important; margin-bottom: 4px !important; font-size: 13px !important;">Sensitive account types</div>
            <span style="display: block !important; color: #6c757d !important; font-size: 12px !important; margin-bottom: 6px !important;">
              Signing in to a role on an account that matches any of these types pops the confirmation modal.
            </span>
            <div id="tm_gs_signin_types" style="
                border: 1px solid #e1e4e8 !important;
                border-radius: 4px !important;
                padding: 8px 12px !important;
                background: #fafbfc !important;
            ">${o}</div>
          </div>

          <div style="margin-top: 18px !important; text-align: right !important;">
            <button data-action="cancel" type="button" style="
                padding: 8px 16px !important; margin-right: 10px !important;
                border: 1px solid #ccc !important; background: white !important;
                border-radius: 4px !important; cursor: pointer !important;
            ">Cancel</button>
            <button data-action="save" type="button" style="
                padding: 8px 16px !important;
                border: 1px solid #0073bb !important;
                background: #0073bb !important; color: white !important;
                border-radius: 4px !important; cursor: pointer !important;
            ">Save</button>
          </div>
        </div>
      </div>
    `;i("body").append(n);let a=i("#tm_general_settings_modal"),s=()=>a.remove();a.on("click",function(l){l.target===this&&s()}),a.find('[data-action="cancel"]').on("click",s),a.find('[data-action="save"]').on("click",async function(){let l=(i("#tm_gs_region").val()||"").trim(),m=!!a.find("#tm_gs_remember_region").prop("checked"),h=!!a.find("#tm_gs_region_lock").prop("checked"),T=(i("#tm_gs_homepage").val()||"").trim(),w=(i("#tm_gs_signin_keywords").val()||"").trim(),R=w?w.split(",").map(g=>g.trim()).filter(Boolean):[],x=a.find(".tm_signin_type_id:checked").get().map(g=>g.value),y=It,d=Nt;await X.save({region:l,rememberRegion:m,regionLock:h,homepage:T,signinRoleKeywords:R,signinTypeIds:x}),Qo(),s(),It!==y||Nt!==d?(S("Region settings changed \u2014 reloading to refresh service links\u2026","success",r.TOAST_DURATION),setTimeout(()=>location.reload(),800)):S("Settings saved!","success",r.TOAST_DURATION)})}),i("body").on("click","#tm_manage_role_names",function(t){t.preventDefault(),Ee({modalId:"tm_role_names_modal",title:"Role Names",description:"Filter buttons that match against the role name (not account info). Useful for picking out Admin / ReadOnly / DevOps etc. Patterns are case-insensitive substrings of the role text.",addButtonLabel:"Add role-name filter",labelPlaceholder:"e.g. Admin",patternHelp:"One keyword per line \u2014 e.g. admin, readonly, devops",defaults:r.DEFAULT_ROLE_PATTERNS,current:Kt.entries(),onSave:e=>Kt.save(e),onChangeIds:e=>$e("role",e,Kt.entries()),onAfterSave:()=>{Ct("role",Kt.entries()),K.applyFilters()},toastOnSave:"Role names saved!"})}),i("body").on("click",".tm_filter_button",function(t){t.preventDefault();let e=i(this),o=String(e.data("group")),n=String(e.data("filter"));if(c(`Filter clicked: ${o}:${n}`),e.hasClass("tm_custom_shortcut")){let a=t.target&&t.target.closest&&t.target.closest(".tm_shortcut_del");if(a){ie(e,a,()=>{let s=ct.findByFilter(n),l=s?s.label:"";ct.remove(s).then(m=>{m&&S(`Removed shortcut "${l}"`,"info",r.TOAST_DURATION_SHORT)})});return}ae(),ct.applyShortcut(ct.findByFilter(n));return}e.toggleClass("active"),e.hasClass("active")?C[o].includes(n)||C[o].push(n):C[o]=C[o].filter(a=>a!==n),c("Updated filters:",C),K.applyFilters()}),A(r.SELECTORS.SEARCH_INPUT).on("input",function(){H=(i(this).val()||"").trim(),W=-1,i(".saml-role.tm_kb_selected").removeClass("tm_kb_selected"),St("tm_search_input","tm_search_field"),(H.length>=2||H.length===0)&&K.applyFilters()});let Jr=["tag","role","name","account","env","type","org","is"],Wr=t=>{switch(t){case"tag":case"tags":return Z.allTags();case"env":case"environment":return F.entries().map(e=>e.label).filter(Boolean);case"type":return ot.entries().map(e=>e.label).filter(Boolean);case"org":case"organization":case"organisation":return pt.entries().map(e=>e.label).filter(Boolean);case"is":case"source":return["jump","direct"];case"role":{let e=new Set;return document.querySelectorAll("#tm_role_list .tm_role_name").forEach(o=>{let n=o.textContent.trim();n&&e.add(n)}),[...e].sort((o,n)=>o.localeCompare(n))}default:return[]}},fn=()=>{let t=document.getElementById("tm_search_input");if(!t)return null;let e=t.value,o=t.selectionStart==null?e.length:t.selectionStart,n=o;for(;n>0&&!/\s/.test(e[n-1]);)n--;let a=o;for(;a<e.length&&!/\s/.test(e[a]);)a++;let s=e.slice(n,a),l="";s[0]==="-"&&(l="-",s=s.slice(1));let m=s.indexOf(":");if(m>0&&ze.has(s.slice(0,m).toLowerCase())){let w=s.slice(0,m).toLowerCase(),R=s.slice(m+1),x=(R.split(",").pop()||"").toLowerCase(),y=Wr(w).filter(d=>d.toLowerCase().includes(x)).slice(0,8);return{kind:"value",start:n,end:a,neg:l,field:w,valPart:R,items:y}}let h=s.toLowerCase(),T=Jr.filter(w=>h===""||w.startsWith(h)).slice(0,8);return{kind:"field",start:n,end:a,neg:l,items:T}},hn={account:"type an account id",acct:"type an account id",id:"type an account id",name:"type text to match"},Vr=()=>{let t=document.getElementById("tm_search_matchcount"),e=document.getElementById("tm_search_foot");if(e&&e.classList.toggle("tm_foot_on",yt.hasCurrent()),!t)return;let o=document.getElementById("tm_search_input");if(!(o?o.value.trim():"")){t.textContent="";return}let a=Ao;t.textContent=a===0?"no matches":a===1?"1 match":`${a} matches`},qr=`<div class="tm_suggest_keys">${Gn?"\u2325\u2191\u2193":"Alt+\u2191\u2193"} move \xB7 \u21B5 add</div>`,Tt=()=>{let t=document.getElementById("tm_search_suggest"),e=document.getElementById("tm_search_input");if(!t||!e)return;let o=fn();Lt=o&&o.items?o.items:[],W>=Lt.length&&(W=Lt.length-1);let n=Lt.length?Lt.map((s,l)=>{let m=o.kind==="field"?`${v(s)}:`:v(s);return`<button type="button" class="tm_suggest_chip${l===W?" tm_suggest_active":""}" data-val="${v(s)}">${m}</button>`}).join(""):"",a=o&&o.kind==="value"&&hn[o.field]?v(hn[o.field]):"no matching values";t.innerHTML=(n?`<div class="tm_suggest_chips">${n}</div>`:`<div class="tm_suggest_none">${a}</div>`)+'<div class="tm_suggest_legend"><b>prod dev</b> both \xB7 <b>prod,dev</b> either \xB7 <b>-dev</b> exclude \xB7 <b>"a b"</b> exact</div>'+(n?qr:""),Vr()},Xr=t=>{let e=[...document.querySelectorAll("#tm_search_suggest .tm_suggest_chip")],o=e.length;if(!o)return;let n=W;if(n<0){W=t==="ArrowUp"||t==="ArrowLeft"?o-1:0,Tt();return}if(t==="ArrowRight"){W=(n+1)%o,Tt();return}if(t==="ArrowLeft"){W=(n-1+o)%o,Tt();return}let a=e.map(y=>y.getBoundingClientRect()),s=a[n],l=s.left+s.width/2,m=y=>Math.round(y.top),h=m(s),T=t==="ArrowDown"?1:-1,w=-1,R=1/0,x=1/0;for(let y=0;y<o;y++){let d=(m(a[y])-h)*T;if(d<=0)continue;let g=Math.abs(a[y].left+a[y].width/2-l);(d<R||d===R&&g<x)&&(w=y,R=d,x=g)}w>=0&&(W=w,Tt())},bn=t=>{let e=document.getElementById("tm_search_input"),o=fn();if(!e||!o||t==null)return;W=-1;let n;if(o.kind==="field")n=`${o.neg}${t}:`;else{let m=o.valPart.split(",");m[m.length-1]=t,n=`${o.neg}${o.field}:${m.join(",")} `}let a=e.value.slice(0,o.start),s=e.value.slice(o.end);e.value=a+n+s;let l=(a+n).length;e.setSelectionRange(l,l),e.dispatchEvent(new Event("input",{bubbles:!0})),e.focus(),Tt()},lo=A(r.SELECTORS.SEARCH_INPUT);lo.on("focus",function(){W=-1,mo(!1),Tt()}),lo.on("input",Tt),lo.on("keyup",Tt),i("body").on("mousedown",".tm_suggest_chip",function(t){t.preventDefault()}),i("body").on("click",".tm_suggest_chip",function(t){t.preventDefault(),bn(this.getAttribute("data-val"))});let Qr=()=>{let t=document.getElementById("tm_search_input"),o=(t?t.value.trim():"").replace(/-?[A-Za-z]+:/g," ").replace(/["',]/g," ").split(/\s+/).filter(Boolean).slice(0,4).join(" ");if(o)return o;let n=C;return[...n.tag,...n.env,...n.type,...n.org,...n.role].filter(Boolean).slice(0,3).join(" ")||"My view"},mo=t=>{let e=document.getElementById("tm_search_save");e&&e.classList.remove("tm_saving");let o=document.getElementById("tm_search_input");t&&o&&o.focus()},yn=async()=>{let t=document.getElementById("tm_search_save_name");if(!t)return;let e=t.value.trim();if(!e){t.focus();return}let o=await ct.addCurrent(e);mo(!0),o&&S(`Saved shortcut "${e}"`,"success",r.TOAST_DURATION_SHORT)};i("body").on("mousedown","#tm_search_save_btn, #tm_search_save_go",function(t){t.preventDefault()}),i("body").on("click","#tm_search_save_btn",function(t){t.preventDefault();let e=document.getElementById("tm_search_save"),o=document.getElementById("tm_search_save_name");!e||!o||(e.classList.add("tm_saving"),o.value=Qr(),o.focus(),o.select())}),i("body").on("click","#tm_search_save_go",function(t){t.preventDefault(),yn()}),i("body").on("keydown","#tm_search_save_name",function(t){t.key==="Enter"?(t.preventDefault(),t.stopPropagation(),yn()):t.key==="Escape"&&(t.preventDefault(),t.stopPropagation(),mo(!0))}),i("body").on("mousedown","#tm_search_clear",function(t){t.preventDefault()}),i("body").on("click","#tm_search_clear",function(t){t.preventDefault();let e=document.getElementById("tm_search_input");e&&(e.value="",e.focus()),H="",K.applyFilters(),St("tm_search_input","tm_search_field"),Tt()}),window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").addListener(e=>{dt==="auto"&&(c("System theme changed:",e.matches?"dark":"light"),Ut.applyTheme("auto"))}),Fn.observe(document.body,{childList:!0,subtree:!0});try{dt=await k.getTheme(),c("Loaded theme:",dt),await Ut.applyTheme(dt)}catch(t){console.error("Error loading theme:",t),dt="light",await Ut.applyTheme(dt)}c("Initializing favorites...");try{await Zt.loadCache(),c("Favorites cache initialized:",kt),await Zt.updateButtons(),c("Favorite buttons updated successfully")}catch(t){console.error("Error during favorites initialization:",t)}c("Initializing custom shortcuts...");try{await ct.loadCache(),c("Custom shortcuts cache initialized:",at),ct.updateSection(),c("Shortcuts section updated successfully")}catch(t){console.error("Error during custom shortcuts initialization:",t)}c("Initializing compact mode...");try{await me.loadSetting(),c("Loaded compact mode:",zt),me.apply(),me.updateButton(),c("Compact mode applied successfully")}catch(t){console.error("Error during compact mode initialization:",t)}try{await be.loadSetting(),be.updateButton()}catch(t){console.error("Error loading sign-in tab setting:",t)}i("#tm_recent_limit").text(`Recent: ${$t.getLimit()}`);try{it=await k.getTabGroupTag()}catch(t){console.error("Error loading tab group tag:",t)}try{st=await k.getTabGroupMode(),Oe()}catch(t){console.error("Error loading tab group mode:",t)}_n(),St("tm_search_input","tm_search_field");let uo=()=>{let t=document.getElementById("tm_interface_wrapper"),e=document.getElementById("tm_actions_container");if(!t||!e)return;let o=t.getBoundingClientRect(),n=o.top+o.height/2;e.style.setProperty("--tm-handle-top",Math.max(16,n-20)+"px")};if(uo(),window.addEventListener("resize",uo),window.ResizeObserver){let t=new ResizeObserver(()=>uo()),e=document.getElementById("tm_interface_wrapper");e&&t.observe(e)}try{bt=await k.getStartView(),He(),bt&&yt.apply(bt,!0)}catch(t){console.error("Error applying start view:",t)}an(),Jt();try{chrome.runtime.onMessage.addListener(t=>{t&&t.type==="hop_sessions_changed"&&Jt({keepOpen:gt})})}catch{}document.addEventListener("visibilitychange",()=>{document.hidden||Jt({keepOpen:gt})}),setInterval(()=>{gt&&Jt({keepOpen:!0})},3e4),de(),c(`Added buttons to ${i(".tm_role_buttons").length} roles`);try{await k.getWelcomeSeen()||un({firstRun:!0})}catch(t){console.warn("Welcome-modal first-run check failed:",t)}})();})();
