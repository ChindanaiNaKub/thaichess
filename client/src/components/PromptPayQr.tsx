type PromptPayQrProps = {
  label?: string;
};

const PROMPTPAY_QR_PATH =
  'M1 1.5h7m1 0h1m1 0h6m1 0h1m4 0h7M1 2.5h1m5 0h1m5 0h2m4 0h1m3 0h1m5 0h1M1 3.5h1m1 0h3m1 0h1m1 0h10m2 0h1m1 0h1m1 0h3m1 0h1M1 4.5h1m1 0h3m1 0h1m2 0h1m1 0h1m1 0h1m3 0h1m1 0h1m2 0h1m1 0h3m1 0h1M1 5.5h1m1 0h3m1 0h1m2 0h4m2 0h2m2 0h1m2 0h1m1 0h3m1 0h1M1 6.5h1m5 0h1m1 0h4m3 0h1m3 0h1m2 0h1m5 0h1M1 7.5h7m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h7M12 8.5h1m6 0h2M1 9.5h1m1 0h1m3 0h2m2 0h1m5 0h1m1 0h2m3 0h1m2 0h1m1 0h1M1 10.5h2m1 0h3m3 0h1m1 0h4m5 0h1m1 0h1m1 0h1m1 0h1M1 11.5h1m2 0h2m1 0h1m1 0h1m2 0h2m3 0h3m1 0h1m2 0h3m1 0h2M1 12.5h5m5 0h1m2 0h2m3 0h2M1 13.5h2m1 0h4m1 0h1m1 0h5m1 0h2m1 0h4m1 0h1m3 0h1M4 14.5h2m2 0h3m1 0h1m3 0h1m1 0h1m7 0h1m2 0h1M3 15.5h1m2 0h3m1 0h6m1 0h1m2 0h1m1 0h3m1 0h4M1 16.5h1m2 0h1m1 0h1m3 0h1m2 0h1m3 0h2m1 0h2m3 0h5M7 17.5h5m2 0h3m2 0h1m1 0h5m1 0h3M5 18.5h2m1 0h3m1 0h1m1 0h1m2 0h1m1 0h3m2 0h1M1 19.5h4m2 0h1m1 0h1m2 0h1m3 0h1m1 0h1m1 0h7m1 0h2M4 20.5h1m3 0h1m1 0h1m1 0h1m1 0h1m3 0h1m7 0h1M1 21.5h2m2 0h5m2 0h1m1 0h1m1 0h2m1 0h1m1 0h5m1 0h3M9 22.5h1m2 0h2m4 0h2m1 0h1m3 0h1m1 0h1M1 23.5h7m1 0h4m1 0h2m1 0h1m3 0h1m1 0h1m1 0h2m1 0h2M1 24.5h1m5 0h1m2 0h1m1 0h1m2 0h1m2 0h1m2 0h1m3 0h4M1 25.5h1m1 0h3m1 0h1m5 0h3m1 0h1m2 0h6m3 0h1M1 26.5h1m1 0h3m1 0h1m2 0h2m2 0h2m2 0h2M1 27.5h1m1 0h3m1 0h1m1 0h1m2 0h1m3 0h1m1 0h1m1 0h3m1 0h6M1 28.5h1m5 0h1m3 0h1m6 0h1m1 0h1m2 0h2m2 0h2M1 29.5h7m1 0h1m1 0h4m1 0h1m1 0h2m1 0h2m1 0h6';

export default function PromptPayQr({ label }: PromptPayQrProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 31 31"
      shapeRendering="crispEdges"
      role="img"
      aria-label={label}
      className="block h-60 w-60"
    >
      <path fill="#ffffff" d="M0 0h31v31H0z" />
      <path stroke="#000000" d={PROMPTPAY_QR_PATH} />
    </svg>
  );
}
