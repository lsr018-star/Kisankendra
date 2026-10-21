import StaticPage from "@/components/StaticPage";

export default function PrivacyPage() {
  return (
    <StaticPage title="Privacy Policy">
      <h2>What we collect</h2>
      <ul>
        <li>Account details: name, mobile number, email (optional), village and delivery addresses.</li>
        <li>Order records: products, quantities, prices, delivery and payment status.</li>
        <li>Support requests, including crop problem descriptions and any images you attach.</li>
        <li>For partner shops: business details, licence details and settlement information where required.</li>
      </ul>
      <h2>How we use it</h2>
      <ul>
        <li>To fulfil orders through authorised partner shops and provide customer support.</li>
        <li>A partner shop sees only the customer records and orders it is authorised to manage. Shops cannot see another shop&apos;s private customer data.</li>
        <li>Promotional messages are sent only where consent has been recorded.</li>
      </ul>
      <h2>Your choices</h2>
      <ul>
        <li>You may view and correct your profile and addresses from your account.</li>
        <li>You may request correction or deletion of your personal data through the Grievance contact, subject to records we must retain by law (such as invoices).</li>
        <li>We do not sell personal data.</li>
      </ul>
      <h2>Security</h2>
      <p>Passwords are stored hashed, sessions use secure cookies, and access is controlled by role on the server. Financial credentials and card details are never stored by Kisankendra.</p>
      <h2>Consent</h2>
      <p>By registering you consent to the processing described here for operating your account and orders. This notice will be updated to match the Digital Personal Data Protection Act requirements before launch.</p>
    </StaticPage>
  );
}
