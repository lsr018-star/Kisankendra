import StaticPage from "@/components/StaticPage";

export default function TermsPage() {
  return (
    <StaticPage title="Terms of Use">
      <h2>Marketplace role</h2>
      <p>Kisankendra provides an ordering platform connecting farmers with authorised partner shops. Unless stated otherwise for a specific order, the partner shop shown on the order and invoice is the seller of record and is responsible for product quality, invoicing and delivery. Platform commission and settlement terms between Kisankendra and each shop are recorded per order.</p>
      <h2>Products</h2>
      <ul>
        <li>Pesticides and fertilizers are regulated products. They are supplied only by shops holding valid licences for the relevant category.</li>
        <li>Always use products strictly as directed on the printed product label. Information on this website does not replace the label.</li>
        <li>Product availability and prices are confirmed by the assigned shop at acceptance.</li>
      </ul>
      <h2>Orders and cancellations</h2>
      <ul>
        <li>An order is confirmed when an eligible shop accepts it. If no shop can fulfil it, you are informed and may cancel at no cost.</li>
        <li>Confirmed prices do not change after placement. Products are never substituted without your consent.</li>
        <li>Refunds follow the refund policy shown at checkout and on your order page.</li>
      </ul>
      <h2>Partner shops</h2>
      <p>Shops are responsible for the accuracy of their inventory, for honouring accepted orders, and for keeping licences valid. Kisankendra may suspend shops that breach these terms.</p>
      <h2>Liability</h2>
      <p>Crop advice provided through support features is general guidance based on the information you share and is not a guarantee of outcome. For official advice, consult the agriculture department.</p>
    </StaticPage>
  );
}
