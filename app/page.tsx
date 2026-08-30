import Header from '@/components/Header'
import ProductsList from '@/components/ProductsList'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center relative overflow-hidden">
      {/* استیکرهای پس‌زمینه صفحه اصلی */}
   
      <div className="absolute bottom-40 left-16 w-32 h-32 rounded-full border border-accent-400/10 animate-ping" style={{animationDuration: '3s'}}></div>
      
      {/* اضافه کردن فاصله از بالا تا هدر شیشه‌ای پوشیده نشه */}
      <div className="w-full pt-28 pb-16">
        
        {/* هیرو سکشن (بخش بالای سایت) */}
        <div className="text-center z-10 mb-8 px-4">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-white via-accent-300 to-primary-400 bg-clip-text text-transparent">
           کافینگهای نامحدود امام زمان سرعتی 
          </h1>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            از بین پلن‌های زیر بهترین انتخاب رو برای خودت داشته باش
          </p>
        </div>

        {/* فراخوانی کامپوننت محصولات */}
        <ProductsList />

      </div>

      <Header />
    </main>
  )
}