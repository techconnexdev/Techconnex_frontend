"use client"
import { brands } from '@/public/assets'
import { motion } from 'framer-motion'
import Image from 'next/image'
import React from 'react'
import * as motionVariants from '@/lib/motionVariants'

const Brand = () => {
  return (
    <section className='section'>
        <div className='container max-w-screen-lg'>
            <motion.p variants={motionVariants.fadeInUp} initial='start' whileInView='end' viewport={{once:true}} className='text-center mb-4 md:mb-6'>
            Powered by Secure Technologies
            </motion.p>

            <motion.div variants={motionVariants.staggerContainer} initial='start' whileInView='end' className='flex justify-center flex-wrap gap-5 md:gap-10'>
                {brands.map((brand, index)=>(
                    <motion.figure variants={motionVariants.fadeInUp} key={index}><Image width={100} height={100} src={brand} alt='brands' className='opacity-[0.6]'></Image></motion.figure>
                ))}
            </motion.div>
        </div>
    </section>
  )
}

export default Brand