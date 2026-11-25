import{r as i}from"./vendor-ui-7IIJxYfQ.js";const o="pwd-page-setup";function s(r="portrait",e){i.useEffect(()=>{const t=()=>{document.getElementById(o)?.remove();const n=document.createElement("style");n.id=o,n.textContent=`
        @page {
          size: A4 ${r};
          margin: 0;${e?`
          @bottom-center {
            content: "${e}";
            font-size: 8pt; font-family: Arial, sans-serif; color: #000;
          }`:""}
        }
      `,document.head.appendChild(n)};return t(),window.addEventListener("beforeprint",t),()=>{window.removeEventListener("beforeprint",t),document.getElementById(o)?.remove()}},[r,e])}export{s as u};
