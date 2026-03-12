/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body, Button, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'

interface InviteEmailProps { siteName: string; siteUrl: string; confirmationUrl: string }

export const InviteEmail = ({ siteName, siteUrl, confirmationUrl }: InviteEmailProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Vous avez été invité à rejoindre {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}><Text style={brandLabel}>WIINUP MAX</Text></Section>
        <Section style={bodyPad}>
          <Heading style={h1}>Vous êtes invité 🤝</Heading>
          <Text style={text}>Vous avez été invité à rejoindre <Link href={siteUrl} style={link}><strong>{siteName}</strong></Link> — la plateforme B2B d'apport d'affaires. Cliquez ci-dessous pour accepter et créer votre compte.</Text>
          <Button style={button} href={confirmationUrl}>Accepter l'invitation →</Button>
          <Text style={hint}>Si vous ne vous attendiez pas à cette invitation, ignorez cet email.</Text>
        </Section>
        <Hr style={divider} />
        <Section style={footerSection}><Text style={footerText}>WIINUP MAX — La plateforme B2B d'apport d'affaires</Text></Section>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

const P = '#0f2d6b', A = '#ff6b00', T = '#0d1829', M = '#6a7796', B = '#e8ecf3'
const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { maxWidth: '580px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(15,45,107,0.10)' }
const header = { background: `linear-gradient(135deg, ${P} 0%, #1a3e7a 100%)`, padding: '28px 40px', textAlign: 'center' as const }
const brandLabel = { margin: '0', fontSize: '11px', color: '#94a3b8', letterSpacing: '3px', textTransform: 'uppercase' as const, fontWeight: '700' }
const bodyPad = { padding: '40px 40px 0' }
const h1 = { margin: '0 0 16px', fontSize: '26px', fontWeight: '800', color: T, lineHeight: '1.3' }
const text = { fontSize: '15px', color: M, lineHeight: '1.7', margin: '0 0 24px' }
const link = { color: P, textDecoration: 'underline' }
const button = { backgroundColor: A, color: '#ffffff', fontSize: '15px', fontWeight: '700', padding: '16px 36px', borderRadius: '10px', textDecoration: 'none', display: 'inline-block', margin: '0 0 24px' }
const hint = { fontSize: '13px', color: M, lineHeight: '1.6', margin: '0 0 40px', textAlign: 'center' as const }
const divider = { borderColor: B, margin: '0' }
const footerSection = { backgroundColor: '#f8fafc', padding: '24px 40px' }
const footerText = { margin: '0', fontSize: '12px', color: M, textAlign: 'center' as const, lineHeight: '1.7' }
