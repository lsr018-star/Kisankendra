import StaticPage from "@/components/StaticPage";

export default function GrievancePage() {
  return (
    <StaticPage title="Grievance Redressal">
      <h2>How to raise a complaint</h2>
      <p>For order, product, refund or privacy complaints, first raise a support request from your account (farmers: Crop Support page; shops: contact admin). If it is not resolved within 7 days, escalate to the Grievance Officer below.</p>
      <h2>Grievance Officer (template — details to be confirmed before launch)</h2>
      <ul>
        <li>Name: To be appointed and published before public launch.</li>
        <li>Email: grievance@kisankendra.in (demo contact for this development build)</li>
        <li>Address: Kisankendra, Seoni Malwa, Narmadapuram District, Madhya Pradesh.</li>
        <li>Acknowledgement: within 48 hours. Resolution target: within 30 days, as required under the Consumer Protection (E-Commerce) Rules.</li>
      </ul>
      <h2>What to include</h2>
      <ul>
        <li>Your name and registered mobile number.</li>
        <li>Order number or ticket number, if any.</li>
        <li>A clear description of the issue.</li>
      </ul>
    </StaticPage>
  );
}
