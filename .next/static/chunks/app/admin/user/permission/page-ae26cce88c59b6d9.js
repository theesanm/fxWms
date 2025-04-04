(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[8034],{18346:(e,s,r)=>{"use strict";r.d(s,{A:()=>n});var a=r(23464);r(49509);let t="/api/postgrest";console.log("[PostgREST Client] Using baseURL: ".concat(t));let i=a.A.create({baseURL:t,headers:{Accept:"application/json","Content-Type":"application/json",Prefer:"return=representation"}});i.interceptors.response.use(e=>("get"!==e.config.method&&console.log("PostgREST Success:",{url:e.config.url,method:e.config.method,status:e.status,data:e.data}),e),e=>{var s,r,a,t,i,n,o,d;(null==e?void 0:null===(s=e.response)||void 0===s?void 0:s.status)!==409&&console.error("PostgREST Error:",{url:(null==e?void 0:null===(t=e.config)||void 0===t?void 0:t.url)||"unknown",method:(null==e?void 0:null===(i=e.config)||void 0===i?void 0:i.method)||"unknown",message:(null==e?void 0:e.message)||"No error message",status:(null==e?void 0:null===(n=e.response)||void 0===n?void 0:n.status)||"unknown",statusText:(null==e?void 0:null===(o=e.response)||void 0===o?void 0:o.statusText)||"unknown",data:(null==e?void 0:null===(d=e.response)||void 0===d?void 0:d.data)||null,code:(null==e?void 0:e.code)||"unknown"});let l=Error((null==e?void 0:e.message)||"Unknown error");return Object.assign(l,{status:(null==e?void 0:null===(r=e.response)||void 0===r?void 0:r.status)||500,data:(null==e?void 0:null===(a=e.response)||void 0===a?void 0:a.data)||null,code:(null==e?void 0:e.code)||"UNKNOWN_ERROR",config:(null==e?void 0:e.config)||{}}),Promise.reject(l)});let n=i},30285:(e,s,r)=>{"use strict";r.d(s,{$:()=>n});var a=r(95155),t=r(12115);let i=(0,r(74466).F)("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50",{variants:{variant:{default:"bg-primary text-white hover:bg-primary-dark shadow-sm dark:bg-primary-dark dark:hover:bg-primary",outline:"border border-secondary-medium bg-white text-secondary-dark hover:bg-secondary-light dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700",success:"bg-success text-white hover:bg-success/90 dark:bg-success/80 dark:hover:bg-success",danger:"bg-danger text-white hover:bg-danger/90 dark:bg-danger/80 dark:hover:bg-danger",ghost:"hover:bg-secondary-light text-secondary-dark dark:text-gray-300 dark:hover:bg-gray-800",link:"text-primary hover:text-primary-dark underline-offset-4 hover:underline dark:text-blue-400 dark:hover:text-blue-300"},size:{default:"h-9 px-4 py-2",sm:"h-8 px-3 text-xs",lg:"h-10 px-6",icon:"h-9 w-9"}},defaultVariants:{variant:"default",size:"default"}}),n=t.forwardRef((e,s)=>{let{className:r,variant:t,size:n,...o}=e;return(0,a.jsx)("button",{className:i({variant:t,size:n,className:r}),ref:s,...o})});n.displayName="Button"},40151:(e,s,r)=>{Promise.resolve().then(r.bind(r,86103))},59434:(e,s,r)=>{"use strict";r.d(s,{cn:()=>i});var a=r(52596),t=r(39688);function i(){for(var e=arguments.length,s=Array(e),r=0;r<e;r++)s[r]=arguments[r];return(0,t.QP)((0,a.$)(s))}},62523:(e,s,r)=>{"use strict";r.d(s,{p:()=>t});var a=r(95155);let t=r(12115).forwardRef((e,s)=>{let{...r}=e;return(0,a.jsx)("input",{ref:s,...r})});t.displayName="Input"},86103:(e,s,r)=>{"use strict";r.d(s,{PermissionManager:()=>u});var a=r(95155),t=r(12115),i=r(62177),n=r(30285),o=r(62523),d=r(88539),l=r(18346),c=r(56671);function u(){let[e,s]=(0,t.useState)([]),[r,u]=(0,t.useState)(null),{register:m,handleSubmit:g,reset:p,setValue:x}=(0,i.mN)(),[v,h]=(0,t.useState)(!0),b=async()=>{try{let e=await l.A.get("/permissions");s(e.data),h(!1)}catch(e){console.error("Error fetching permissions:",e),c.oR.error("Failed to load permissions"),h(!1)}};(0,t.useEffect)(()=>{b()},[]);let y=async e=>{try{r?(await l.A.patch("/permissions?permission_id=eq.".concat(r.permission_id),e),c.oR.success("Permission updated successfully")):(await l.A.post("/permissions",e),c.oR.success("Permission created successfully")),b(),j()}catch(e){c.oR.error("Failed to save permission"),console.error("Error saving permission:",e)}},f=e=>{u(e),Object.keys(e).forEach(s=>{x(s,e[s])})},k=async e=>{if(confirm("Are you sure you want to delete this permission?"))try{await l.A.delete("/permissions?permission_id=eq.".concat(e)),c.oR.success("Permission deleted successfully"),b()}catch(e){c.oR.error("Failed to delete permission"),console.error("Error deleting permission:",e)}},j=()=>{u(null),p()};return v?(0,a.jsx)("div",{className:"flex items-center justify-center p-4",children:(0,a.jsx)("div",{className:"text-lg",children:"Loading..."})}):(0,a.jsx)("div",{className:"container mx-auto p-6 dark:bg-gray-900",children:(0,a.jsxs)("div",{className:"bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-secondary-medium dark:border-gray-700 p-6",children:[(0,a.jsx)("h2",{className:"text-xl font-semibold mb-4 dark:text-gray-100",children:"Permissions"}),(0,a.jsxs)("div",{className:"space-y-6",children:[(0,a.jsxs)("div",{className:"bg-white dark:bg-gray-800 rounded-lg p-6",children:[(0,a.jsx)("h2",{className:"text-xl font-semibold mb-4 dark:text-gray-100",children:r?"Edit Permission":"Create Permission"}),(0,a.jsxs)("form",{onSubmit:g(y),className:"space-y-4",children:[(0,a.jsxs)("div",{children:[(0,a.jsx)("label",{className:"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",children:"Permission Name"}),(0,a.jsx)(o.p,{...m("permission_name"),className:"dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"})]}),(0,a.jsxs)("div",{children:[(0,a.jsx)("label",{className:"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",children:"Description"}),(0,a.jsx)(d.T,{...m("description"),className:"dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"})]}),(0,a.jsxs)("div",{className:"flex gap-2",children:[(0,a.jsx)(n.$,{type:"submit",children:r?"Update":"Create"}),r&&(0,a.jsx)(n.$,{type:"button",variant:"outline",onClick:j,children:"Cancel"})]})]})]}),(0,a.jsxs)("div",{className:"card",children:[(0,a.jsx)("h2",{className:"text-xl font-semibold mb-4 dark:text-gray-100",children:"Permissions"}),(0,a.jsx)("div",{className:"divide-y divide-gray-200 dark:divide-gray-700",children:e.map(e=>(0,a.jsxs)("div",{className:"py-4 flex items-center justify-between",children:[(0,a.jsxs)("div",{children:[(0,a.jsx)("h3",{className:"text-lg font-medium dark:text-gray-200",children:e.permission_name}),(0,a.jsx)("p",{className:"text-gray-600 dark:text-gray-400",children:e.description})]}),(0,a.jsxs)("div",{className:"flex gap-2",children:[(0,a.jsx)(n.$,{onClick:()=>f(e),variant:"outline",size:"sm",children:"Edit"}),(0,a.jsx)(n.$,{onClick:()=>k(e.permission_id),variant:"danger",size:"sm",children:"Delete"})]})]},e.permission_id))})]})]})]})})}},88539:(e,s,r)=>{"use strict";r.d(s,{T:()=>n});var a=r(95155),t=r(12115),i=r(59434);let n=t.forwardRef((e,s)=>{let{className:r,...t}=e;return(0,a.jsx)("textarea",{className:(0,i.cn)("flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",r),ref:s,...t})});n.displayName="Textarea"}},e=>{var s=s=>e(e.s=s);e.O(0,[7285,6774,9688,2177,8441,1684,7358],()=>s(40151)),_N_E=e.O()}]);