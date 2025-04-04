(()=>{var e={};e.id=318,e.ids=[318],e.modules={3295:e=>{"use strict";e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},5486:e=>{"use strict";e.exports=require("bcrypt")},10846:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},12412:e=>{"use strict";e.exports=require("assert")},27910:e=>{"use strict";e.exports=require("stream")},28354:e=>{"use strict";e.exports=require("util")},29021:e=>{"use strict";e.exports=require("fs")},29294:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-async-storage.external.js")},33666:(e,r,t)=>{"use strict";t.r(r),t.d(r,{patchFetch:()=>h,routeModule:()=>d,serverHooks:()=>g,workAsyncStorage:()=>l,workUnitAsyncStorage:()=>x});var s={};t.r(s),t.d(s,{POST:()=>c});var o=t(96559),n=t(48088),a=t(37719),u=t(32190),i=t(56604),p=t(49634);async function c(e){try{let r=await e.json(),t=await (0,i.E)(r.password_hash),s={...r,password_hash:t},{password_hash:o,...n}=(await p.A.post("/users",s)).data;return u.NextResponse.json(n)}catch(e){return console.error("Error creating user:",e),u.NextResponse.json({error:"Failed to create user"},{status:500})}}let d=new o.AppRouteRouteModule({definition:{kind:n.RouteKind.APP_ROUTE,page:"/api/users/route",pathname:"/api/users",filename:"route",bundlePath:"app/api/users/route"},resolvedPagePath:"C:\\Projects\\fxWMS\\React\\admin-portal\\src\\app\\api\\users\\route.ts",nextConfigOutput:"standalone",userland:s}),{workAsyncStorage:l,workUnitAsyncStorage:x,serverHooks:g}=d;function h(){return(0,a.patchFetch)({workAsyncStorage:l,workUnitAsyncStorage:x})}},33873:e=>{"use strict";e.exports=require("path")},44870:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},49634:(e,r,t)=>{"use strict";t.d(r,{A:()=>a});var s=t(94612);let o=process.env.POSTGREST_URL||"http://localhost:3000";console.log(`[PostgREST Client] Using baseURL: ${o}`);let n=s.A.create({baseURL:o,headers:{Accept:"application/json","Content-Type":"application/json",Prefer:"return=representation"}});n.interceptors.response.use(e=>("get"!==e.config.method&&console.log("PostgREST Success:",{url:e.config.url,method:e.config.method,status:e.status,data:e.data}),e),e=>{e?.response?.status!==409&&console.error("PostgREST Error:",{url:e?.config?.url||"unknown",method:e?.config?.method||"unknown",message:e?.message||"No error message",status:e?.response?.status||"unknown",statusText:e?.response?.statusText||"unknown",data:e?.response?.data||null,code:e?.code||"unknown"});let r=Error(e?.message||"Unknown error");return Object.assign(r,{status:e?.response?.status||500,data:e?.response?.data||null,code:e?.code||"UNKNOWN_ERROR",config:e?.config||{}}),Promise.reject(r)});let a=n},55511:e=>{"use strict";e.exports=require("crypto")},55591:e=>{"use strict";e.exports=require("https")},56604:(e,r,t)=>{"use strict";t.d(r,{E:()=>n});var s=t(5486),o=t.n(s);async function n(e){if(!e)throw Error("Password is required");return o().hash(e,10)}},57729:()=>{},63033:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},74075:e=>{"use strict";e.exports=require("zlib")},78335:()=>{},79551:e=>{"use strict";e.exports=require("url")},81630:e=>{"use strict";e.exports=require("http")},83997:e=>{"use strict";e.exports=require("tty")},94735:e=>{"use strict";e.exports=require("events")},96487:()=>{}};var r=require("../../../webpack-runtime.js");r.C(e);var t=e=>r(r.s=e),s=r.X(0,[4447,580,4612],()=>t(33666));module.exports=s})();