'use client';

// Last resort: used only when the root layout itself crashes (so no shop styles or fonts are available).
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang='fa' dir='rtl'>
      <body style={{ margin: 0, fontFamily: 'Tahoma, Vazirmatn, sans-serif', background: '#f6f2ea', color: '#241a47' }}>
        <main style={{ maxWidth: 420, margin: '15vh auto 0', padding: 24, textAlign: 'center' }}>
          <h1 style={{ fontSize: 22 }}>مشکلی پیش آمد</h1>
          <p style={{ lineHeight: 1.9, fontSize: 14, opacity: 0.75 }}>سایت فعلاً در دسترس نیست. دوباره تلاش کنید؛ اگر ادامه داشت کمی بعد سر بزنید.</p>
          <button type='button' onClick={() => reset()} style={{ marginTop: 16, padding: '12px 32px', borderRadius: 999, border: 0, background: '#241a47', color: '#fff', fontWeight: 700, fontSize: 15 }}>تلاش دوباره</button>
        </main>
      </body>
    </html>
  );
}
