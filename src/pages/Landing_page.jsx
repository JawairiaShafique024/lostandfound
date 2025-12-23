import React, { useEffect, useState } from 'react'
import HeroSection from '../components/Hero_section'
import { motion } from 'framer-motion'
import AboutUs from '../components/About_us'
import FAQ from '../components/Faq'
import Guidelines from '../components/Guidelines'
import ContactUs from '../components/Contact_us'
import Footer from '../components/Footer'
const Landing_page = () => {
  const [feedbacks, setFeedbacks] = useState([])
  const [fbError, setFbError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/feedbacks/')
        if (!res.ok) throw new Error('feedback endpoint not available')
        const data = await res.json()
        if (!cancelled) setFeedbacks(Array.isArray(data) ? data.slice(0, 6) : [])
      } catch (e) {
        if (!cancelled) setFbError('') // silent if missing
      }
    })()
    return () => { cancelled = true }
  }, [])

  return (
    <div>
        <HeroSection />
        {/* Animated Themed Feedback Highlight (matches About section background) */}
        <section className="relative py-14 bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500 rounded-full blur-2xl opacity-20"></div>
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-teal-500 rounded-full blur-2xl opacity-20"></div>
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="rounded-xl sm:rounded-2xl border border-gray-700 shadow-md bg-gray-800/80 backdrop-blur p-4 sm:p-6 md:p-8"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-blue-400 via-teal-400 to-indigo-400 bg-clip-text text-transparent">
                    Hear from our community 💬✨
                  </h2>
                  <p className="text-sm sm:text-base text-gray-300 mt-1">Real stories after successful returns and reunions.</p>
                </div>
                <a href="#feedback" className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-3 rounded-full bg-gradient-to-r from-blue-500 to-teal-500 text-white text-sm sm:text-base font-semibold hover:shadow-lg transition">
                  Read Feedback
                  <span className="text-lg sm:text-xl">➡️</span>
                </a>
              </div>
            </motion.div>
          </div>
        </section>
        <AboutUs/>

        {/* Public Feedback Section (redesigned carousel) */}
        <section className="py-10 sm:py-12 md:py-16 bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800" id="feedback">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center">Community Feedback</h2>
            <p className="text-sm sm:text-base text-gray-300 text-center mt-2">Real stories from users who matched items successfully</p>

            {feedbacks.length === 0 ? (
              <div className="mt-8 text-center text-gray-400">No feedback yet.</div>
            ) : (
              <div className="mt-8 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700/70 scrollbar-track-transparent">
                <div className="flex gap-5 snap-x snap-mandatory pb-2">
                  {feedbacks.map((fb, idx) => (
                    <motion.article
                      key={fb.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.35, delay: idx * 0.05 }}
                      className="snap-start shrink-0 w-[280px] sm:w-72 md:w-80 rounded-xl sm:rounded-2xl bg-gray-800/80 border border-gray-700/80 shadow-md hover:shadow-lg transition relative"
                    >
                      <div className="absolute -inset-px rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-600/10 via-teal-500/10 to-indigo-500/10 pointer-events-none"></div>
                      <div className="p-4 sm:p-5 relative">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-teal-500 text-white grid place-items-center font-semibold">
                              {(fb.user_name || 'U').slice(0,1).toUpperCase()}
                            </div>
                            <div className="leading-tight">
                              <div className="text-sm text-white font-medium">{fb.user_name || 'User'}</div>
                              <div className="text-[11px] text-gray-400">{new Date(fb.created_at).toLocaleDateString()}</div>
                            </div>
                          </div>
                          {fb.rating ? (
                            <span className="text-yellow-400 text-sm" aria-label={`Rating ${fb.rating} of 5`}>
                              {'★'.repeat(fb.rating)}{'☆'.repeat(5 - fb.rating)}
                            </span>
                          ) : (
                            <span className="text-gray-500 text-sm">No rating</span>
                          )}
                        </div>
                        <p className="mt-3 text-gray-200 text-sm leading-relaxed line-clamp-5">
                          {fb.note || 'No comment provided.'}
                        </p>
                      </div>
                    </motion.article>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <FAQ/>
        <Guidelines/>
        <ContactUs/>
        <Footer/>
    </div>
  )
}

export default Landing_page
