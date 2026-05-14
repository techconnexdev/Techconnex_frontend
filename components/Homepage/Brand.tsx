"use client"
import { brands } from '@/public/assets'
import { motion } from 'framer-motion'
import Image from 'next/image'
import React from 'react'
import * as motionVariants from '@/lib/motionVariants'
import { useI18n } from "@/contexts/I18nProvider"

const Brand = () => {
  const { t } = useI18n()
  return (
    <section className='section'>
        <div className='container max-w-screen-lg'>
            <motion.p variants={motionVariants.fadeInUp} initial='start' whileInView='end' viewport={{once:true}} className='text-center mb-4 md:mb-6'>
            {t("home.brand.poweredBy")}
            </motion.p>

            <motion.div variants={motionVariants.staggerContainer} initial='start' whileInView='end' className='mx-auto flex w-full flex-nowrap items-center justify-between gap-2 sm:gap-3 md:gap-6'>
                {brands.map((brand, index)=>(
                    <motion.figure variants={motionVariants.fadeInUp} key={index} className='shrink'>
                      <Image
                        width={80}
                        height={80}
                        src={brand}
                        alt={t("home.brand.imageAlt")}
                        className='h-auto w-[clamp(34px,8vw,80px)] opacity-[0.6]'
                      />
                    </motion.figure>
                ))}
            </motion.div>
        </div>
    </section>
  )
}

export default Brand