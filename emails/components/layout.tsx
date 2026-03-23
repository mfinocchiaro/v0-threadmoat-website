import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface EmailLayoutProps {
  preview: string
  children: React.ReactNode
}

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{
        backgroundColor: '#0a0a0a',
        fontFamily: 'sans-serif',
        margin: 0,
        padding: 0,
      }}>
        <Container style={{
          maxWidth: '560px',
          margin: '0 auto',
          padding: '40px 20px',
        }}>
          {/* Header with brand */}
          <Section style={{ textAlign: 'center' as const, marginBottom: '32px' }}>
            <Text style={{
              color: '#7c3aed',
              fontSize: '24px',
              fontWeight: 'bold',
              margin: 0,
            }}>
              ThreadMoat
            </Text>
          </Section>

          {/* Content card */}
          <Section style={{
            backgroundColor: '#171717',
            borderRadius: '8px',
            padding: '32px',
            border: '1px solid #262626',
          }}>
            {children}
          </Section>

          {/* Footer */}
          <Section style={{ textAlign: 'center' as const, marginTop: '32px' }}>
            <Text style={{
              color: '#737373',
              fontSize: '12px',
              margin: 0,
            }}>
              ThreadMoat Inc. - Market Intelligence for Industrial AI
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
