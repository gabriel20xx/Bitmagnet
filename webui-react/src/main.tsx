import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ApolloProvider } from '@apollo/client/react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/toaster'
import { apolloClient } from '@/lib/graphql/client'
import { ThemeProvider } from '@/lib/theme/ThemeProvider'
import '@/lib/i18n'
import './index.css'
import { Router } from './Router'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ApolloProvider client={apolloClient}>
      <ThemeProvider>
        <TooltipProvider delayDuration={300}>
          <Router />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </ApolloProvider>
  </StrictMode>,
)
