'use client'

import { createTheme, responsiveFontSizes } from '@mui/material/styles'
import { Lato } from 'next/font/google'

const lato = Lato({
  weight: ['300', '400', '700', '900'],
  subsets: ['latin'],
  display: 'swap',
})

const theme = createTheme({
  colorSchemes: {
    dark: true,
  },
  typography: {
    button: {
      textTransform: 'none',
    },
    fontFamily: `${lato.style.fontFamily}, sans-serif, Arial`,
    h1: {
      fontSize: '4rem',
      fontWeight: 700,
      lineHeight: 1,
    },
    h2: {
      letterSpacing: '-.025em',
      fontWeight: 700,
      fontSize: '2.25rem',
      lineHeight: 2.5,
    },
    h3: {
      fontWeight: 500,
      fontSize: '1.25rem',
      lineHeight: 1.75,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.75,
    },
    body2: {
      fontSize: '1rem',
      lineHeight: 1.75,
    },
  },
})

export default responsiveFontSizes(theme)
