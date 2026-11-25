import{r as u,j as e}from"./vendor-ui-7IIJxYfQ.js";import{T as v}from"./ToolShell-BKvCwzjH.js";import{B as x,L as p,I as c,T as j}from"./textarea-CuzvpNQB.js";import{C as m,a as g,b as _,c as y,d as b}from"./card-B-HDDRXe.js";import{u as D}from"./useDocumentTitle-BH6WyIXI.js";import{D as w}from"./download-DrDuWEq-.js";import"./index-C4s42E9B.js";import"./vendor-query-BsxG483Q.js";import"./house-BwuIGHk_.js";const k=[{left:"3%",delay:"0s",dur:"2.8s"},{left:"11%",delay:"0.4s",dur:"3.2s"},{left:"21%",delay:"0.9s",dur:"2.5s"},{left:"33%",delay:"0.2s",dur:"3.6s"},{left:"46%",delay:"1.1s",dur:"2.9s"},{left:"59%",delay:"0.6s",dur:"3.1s"},{left:"70%",delay:"1.4s",dur:"2.7s"},{left:"81%",delay:"0.3s",dur:"3.4s"},{left:"91%",delay:"0.8s",dur:"2.6s"}];function S(){return e.jsxs("div",{style:{position:"absolute",top:0,left:0,width:"100%",height:"100%",overflow:"hidden",pointerEvents:"none"},children:[k.map((i,r)=>e.jsx("div",{style:{position:"absolute",bottom:"4px",left:i.left,animation:`floatBalloon ${i.dur} ${i.delay} ease-in-out infinite`},children:e.jsx("div",{style:{fontSize:"22px",lineHeight:1,filter:"drop-shadow(0 0 6px #FFD700) drop-shadow(0 0 12px #FF8C00)"},children:"🪔"})},r)),["8%","25%","43%","62%","78%","95%"].map((i,r)=>e.jsx("div",{style:{position:"absolute",top:"4px",left:i,fontSize:"16px",opacity:.7,animation:`floatBalloon ${2.4+r*.3}s ${r*.5}s ease-in-out infinite`},children:"🌸"},`f${r}`))]})}function f(i){const r=["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine"],n=["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"],d=["Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];if(i===0)return"Zero";let a="",o=i;if(o>=1e7){const s=Math.floor(o/1e7);a+=f(s)+" Crore ",o%=1e7}if(o>=1e5){const s=Math.floor(o/1e5);a+=f(s)+" Lakh ",o%=1e5}if(o>=1e3){const s=Math.floor(o/1e3);a+=f(s)+" Thousand ",o%=1e3}if(o>=100){const s=Math.floor(o/100);a+=r[s]+" Hundred ",o%=100}if(o>0)if(o<10)a+=r[o];else if(o<20)a+=d[o-10];else{const s=Math.floor(o/10),t=o%10;a+=n[s],t>0&&(a+=" "+r[t])}return a.trim()}function z(){D("Excel to EMD");const[i,r]=u.useState([]),[n,d]=u.useState({payee:"",amount:0,amount_words:"",work:"",voucher_no:"",cheque_no:"",date:""}),a=()=>{if(!n.payee||!n.amount||!n.work){alert("Please fill in Payee, Amount, and Work details");return}const t=f(n.amount),l={...n,amount_words:t};r([...i,l]),d({payee:"",amount:0,amount_words:"",work:"",voucher_no:"",cheque_no:"",date:""})},o=t=>{r(i.filter((l,h)=>h!==t))},s=t=>{const l=window.open("","_blank","width=794,height=1123");if(!l){alert("Please allow popups to print");return}const h=`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Hand Receipt (RPWA 28)</title>
  <style>
    /* ── HEADER / FOOTER SAFETY NET ── margin:0 kills browser header/footer band.
       If a footer still appears, it will only read: DRAFTED BY PRIYANKA JAIN, PWD UDAIPUR */
    @page {
      size: A4 portrait;
      margin: 0;
      @bottom-center {
        content: "DRAFTED BY PRIYANKA JAIN, PWD UDAIPUR";
        font-size: 8pt;
        font-family: Arial, sans-serif;
        color: #000;
      }
    }
    header, footer { display: none !important; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; background: #fff; color: #000; padding: 12mm; }
    .container {
      width: 100%;
      border: 2px solid #000;
      padding: 14px;
    }
    .header { text-align: center; margin-bottom: 8px; }
    .header h2 { font-size: 14px; margin: 3px 0; }
    .header p  { font-size: 11px; margin: 2px 0; }
    .details p  { font-size: 12px; margin: 5px 0; line-height: 1.4; }
    .amount-words { font-style: italic; }
    .input-field {
      border-bottom: 1px dotted #000;
      padding: 1px 2px;
      display: inline-block;
      min-width: 220px;
    }
    .signature-area, .offices {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      font-size: 11px;
    }
    .signature-area td, .offices td {
      border: 1px solid #000;
      padding: 6px 8px;
      text-align: left;
    }
    .passed-box {
      margin-top: 12px;
      border: 2px solid #000;
      padding: 8px 12px;
      display: inline-block;
      min-width: 280px;
    }
    .passed-box p { margin: 3px 0; font-size: 12px; }
    .blue-text { color: #000080; font-weight: bold; }
    .seal p { margin: 2px 0; font-size: 11px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Payable to: - ${t.payee}</h2>
      <h2>HAND RECEIPT (RPWA 28)</h2>
      <p>(Referred to in PWF&amp;A Rules 418, 424, 436 &amp; 438)</p>
      <p>Division - PWD District Division-II, Udaipur</p>
    </div>

    <div class="details">
      <p>(1) Cash Book Voucher No. ${t.voucher_no||"___________"} &nbsp;&nbsp;&nbsp; Date ${t.date||"___________"}</p>
      <p>(2) Cheque No. and Date ${t.cheque_no||"___________"}</p>
      <p>(3) Pay for ECS Rs.${t.amount}/- (Rupees <span class="amount-words">${t.amount_words} only</span>)</p>
      <p>(4) Paid by me</p>
      <p>(5) Received from The Executive Engineer PWD District Division-II, Udaipur the sum of Rs.&nbsp;${t.amount}/- (Rupees <span class="amount-words">${t.amount_words} only</span>)</p>
      <p>Name of work for which payment is made: <span class="input-field">${t.work}</span></p>
      <p>Chargeable to Head:- 8443 [EMD-Refund]</p>

      <table class="signature-area">
        <tr>
          <td>Witness</td>
          <td>Stamp</td>
          <td>Signature of payee</td>
        </tr>
        <tr>
          <td>Cash Book No. ___________ &nbsp; Page No. ___________</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
        </tr>
      </table>

      <table class="offices">
        <tr>
          <td>For use in the Divisional Office</td>
          <td>For use in the Accountant General's office</td>
        </tr>
        <tr>
          <td>Checked</td>
          <td>Audited/Reviewed</td>
        </tr>
        <tr>
          <td>Accounts Clerk</td>
          <td>DA ___________ &nbsp; Auditor ___________ &nbsp; Supdt. ___________ &nbsp; G.O.</td>
        </tr>
      </table>

      <div class="passed-box">
        <p class="blue-text">Passed for Rs. ${t.amount}</p>
        <p class="blue-text">In Words Rupees: ${t.amount_words} Only</p>
        <p class="blue-text">Chargeable to Head:- 8443 [EMD-Refund]</p>
        <div class="seal" style="margin-top:8px;">
          <p>Ar. ___________</p>
          <p>D.A. ___________</p>
          <p>E.E. ___________</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;l.document.write(h),l.document.close(),l.print()};return e.jsx(v,{title:"Excel to EMD",children:e.jsxs(e.Fragment,{children:[e.jsx("style",{children:`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&display=swap');
        @keyframes floatBalloon {
          0%,100% { transform: translateY(0) rotate(-2deg); }
          50%      { transform: translateY(-14px) rotate(2deg); }
        }
        @keyframes shimmer {
          0%   { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
      `}),e.jsxs("div",{style:{minHeight:"100vh",background:"linear-gradient(160deg, #fff8e1 0%, #fff3e0 40%, #fce4ec 100%)",fontFamily:"'Noto Sans Devanagari','Segoe UI',sans-serif"},children:[e.jsxs("div",{style:{position:"relative",overflow:"hidden",background:"linear-gradient(135deg, #7B0D00 0%, #c0392b 25%, #e67e22 50%, #c0392b 75%, #7B0D00 100%)",backgroundSize:"300% auto",animation:"shimmer 8s linear infinite",borderBottom:"4px solid #FFD700"},children:[e.jsx(S,{}),e.jsxs("div",{style:{position:"relative",zIndex:1,textAlign:"center",padding:"28px 24px 18px"},children:[e.jsx("div",{style:{fontSize:"48px",marginBottom:"6px",filter:"drop-shadow(0 0 12px #FFD700)"},children:"📊"}),e.jsx("div",{style:{color:"#FFD700",fontWeight:900,fontSize:"1.8rem",letterSpacing:"0.06em",textShadow:"0 0 16px rgba(255,215,0,0.8), 0 2px 8px rgba(0,0,0,0.5)"},children:"🪔 Excel to EMD Tool 🪔"}),e.jsx("div",{style:{color:"#FFEAA7",fontWeight:500,fontSize:"0.95rem",letterSpacing:"0.08em",marginTop:"6px"},children:"Hand Receipt Generator (RPWA 28)"}),e.jsx("div",{style:{color:"#FFD700",fontWeight:500,fontSize:"0.8rem",letterSpacing:"0.12em",marginTop:"4px",opacity:.85},children:"✦ Batch EMD Processing  ✦  नवरात्रि की शुभकामनाएं 🌸"})]}),e.jsx("div",{style:{background:"linear-gradient(90deg, #FFD700, #FF8C00, #FFD700)",height:"3px"}})]}),e.jsxs("div",{style:{maxWidth:"1200px",margin:"0 auto",padding:"32px 24px"},children:[e.jsx(m,{style:{background:"linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)",border:"2px solid #4caf50",marginBottom:"24px"},children:e.jsxs(g,{style:{padding:"16px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"},children:[e.jsxs("div",{children:[e.jsx("div",{style:{fontWeight:700,color:"#2e7d32",fontSize:"1rem",marginBottom:"4px"},children:"📥 Sample Input File"}),e.jsx("div",{style:{color:"#388e3c",fontSize:"0.875rem"},children:"Download sample Excel file for reference"})]}),e.jsxs(x,{onClick:()=>{const t=document.createElement("a");t.href="/sample-files/sample-emd-input.xlsx",t.download="sample-emd-input.xlsx",t.click()},style:{background:"linear-gradient(135deg, #4caf50, #2e7d32)",color:"#fff",fontWeight:600},children:[e.jsx(w,{style:{marginRight:"8px",width:"16px",height:"16px"}}),"Download Sample"]})]})}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"24px"},children:[e.jsxs(m,{style:{background:"linear-gradient(135deg, #fffbf0 0%, #fff8e1 100%)",border:"2px solid #e6a817"},children:[e.jsxs(_,{children:[e.jsx(y,{style:{color:"#7B0D00"},children:"Add EMD Receipt"}),e.jsx(b,{style:{color:"#6b3a00"},children:"Enter details to generate hand receipt. Use sample file as reference for format."})]}),e.jsxs(g,{style:{display:"flex",flexDirection:"column",gap:"16px"},children:[e.jsxs("div",{children:[e.jsx(p,{style:{color:"#7B0D00",fontWeight:600},children:"Payee Name *"}),e.jsx(c,{value:n.payee,onChange:t=>d({...n,payee:t.target.value}),placeholder:"Enter payee name",style:{marginTop:"8px"}})]}),e.jsxs("div",{children:[e.jsx(p,{style:{color:"#7B0D00",fontWeight:600},children:"Amount (₹) *"}),e.jsx(c,{type:"number",value:n.amount||"",onChange:t=>d({...n,amount:parseFloat(t.target.value)||0}),placeholder:"Enter amount",style:{marginTop:"8px"}})]}),e.jsxs("div",{children:[e.jsx(p,{style:{color:"#7B0D00",fontWeight:600},children:"Work Description *"}),e.jsx(j,{value:n.work,onChange:t=>d({...n,work:t.target.value}),placeholder:"Enter work description",style:{marginTop:"8px",minHeight:"80px"}})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"},children:[e.jsxs("div",{children:[e.jsx(p,{style:{color:"#7B0D00",fontWeight:600},children:"Voucher No."}),e.jsx(c,{value:n.voucher_no,onChange:t=>d({...n,voucher_no:t.target.value}),placeholder:"Optional",style:{marginTop:"8px"}})]}),e.jsxs("div",{children:[e.jsx(p,{style:{color:"#7B0D00",fontWeight:600},children:"Cheque No."}),e.jsx(c,{value:n.cheque_no,onChange:t=>d({...n,cheque_no:t.target.value}),placeholder:"Optional",style:{marginTop:"8px"}})]})]}),e.jsxs("div",{children:[e.jsx(p,{style:{color:"#7B0D00",fontWeight:600},children:"Date"}),e.jsx(c,{type:"date",value:n.date,onChange:t=>d({...n,date:t.target.value}),style:{marginTop:"8px"}})]}),e.jsx(x,{onClick:a,style:{background:"linear-gradient(135deg, #7B0D00, #c0392b)",color:"#FFD700",fontWeight:700},children:"🪔 Add Receipt"})]})]}),e.jsxs(m,{style:{background:"linear-gradient(135deg, #fffbf0 0%, #fff8e1 100%)",border:"2px solid #e6a817"},children:[e.jsxs(_,{children:[e.jsxs(y,{style:{color:"#7B0D00"},children:["Generated Receipts (",i.length,")"]}),e.jsx(b,{style:{color:"#6b3a00"},children:"Click print to generate hand receipt"})]}),e.jsx(g,{children:i.length===0?e.jsxs("div",{style:{textAlign:"center",padding:"40px",color:"#6b3a00"},children:[e.jsx("div",{style:{fontSize:"48px",marginBottom:"16px"},children:"📋"}),e.jsx("p",{children:"No receipts added yet"}),e.jsx("p",{style:{fontSize:"0.875rem",marginTop:"8px"},children:"Add receipt details using the form"})]}):e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"12px",maxHeight:"500px",overflowY:"auto"},children:i.map((t,l)=>e.jsxs("div",{style:{background:"#fff",border:"1px solid #e6a817",borderRadius:"8px",padding:"16px",display:"flex",flexDirection:"column",gap:"8px"},children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start"},children:[e.jsxs("div",{children:[e.jsx("div",{style:{fontWeight:700,color:"#7B0D00",fontSize:"0.95rem"},children:t.payee}),e.jsxs("div",{style:{color:"#6b3a00",fontSize:"0.875rem",marginTop:"4px"},children:["₹",t.amount.toLocaleString("en-IN")]}),e.jsx("div",{style:{color:"#6b3a00",fontSize:"0.8rem",marginTop:"4px",fontStyle:"italic"},children:t.amount_words})]}),e.jsx(x,{onClick:()=>o(l),variant:"destructive",size:"sm",style:{fontSize:"0.75rem"},children:"Delete"})]}),e.jsxs("div",{style:{fontSize:"0.8rem",color:"#6b3a00",marginTop:"8px"},children:[e.jsx("strong",{children:"Work:"})," ",t.work]}),e.jsx("div",{style:{display:"flex",gap:"8px",marginTop:"8px"},children:e.jsx(x,{onClick:()=>s(t),size:"sm",style:{background:"linear-gradient(135deg, #7B0D00, #c0392b)",color:"#FFD700",fontWeight:600,fontSize:"0.8rem"},children:"🖨️ Print Receipt"})})]},l))})})]})]})]}),e.jsxs("div",{style:{textAlign:"center",padding:"24px",color:"#7B2D00",fontSize:"0.85rem",borderTop:"2px solid #e6a817",background:"linear-gradient(90deg, #fffbf0, #fff8e1, #fffbf0)"},children:[e.jsx("div",{style:{fontSize:"1.2rem",marginBottom:"4px"},children:"🪔 ✦ 🌸 ✦ 🪔"}),e.jsx("div",{style:{fontWeight:700,color:"#7B0D00",marginBottom:"4px"},children:"🏗️ PWD Tools Suite"}),e.jsx("div",{children:"Prepared on Initiative of Mrs. Premlata Jain, AAO | PWD Udaipur, Rajasthan"})]})]})]})})}export{z as default};
