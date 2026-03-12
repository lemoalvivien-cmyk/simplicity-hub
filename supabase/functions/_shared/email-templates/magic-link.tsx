/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Votre lien de connexion {siteName} — valable 10 minutes</Preview>
    <Body style={main}>
      <Container style={container}>
        <div style={header}>
          <Text style={logoText}>{siteName}</Text>
        </div>
        <div style={content}>
          <Heading style={h1}>Votre lien de connexion</Heading>
          <Text style={text}>
            Cliquez sur le bouton ci-dessous pour vous connecter à {siteName}.
            Ce lien est à usage unique et expire dans 10 minutes.
          </Text>
          <Button style={button} href={confirmationUrl}>
            ⚡ Se connecter maintenant
          </Button>
          <Hr style={hr} />
          <Text style={footer}>
            Si vous n'avez pas demandé ce lien, ignorez cet email.
          </Text>
        </div>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
}
const container = {
  maxWidth: '560px',
  margin: '0 auto',
  borderRadius: '12px',
  overflow: 'hidden',
  border: '1px solid #e2e8f0',
}
const header = {
  backgroundColor: 'hsl(218, 72%, 18%)',
  padding: '24px 32px',
}
const logoText = {
  fontSize: '22px',
  fontWeight: '800' as const,
  color: '#ffffff',
  margin: '0',
  letterSpacing: '-0.5px',
}
const content = { padding: '32px 32px 24px' }
const h1 = {
  fontSize: '22px',
  fontWeight: '700' as const,
  color: 'hsl(218, 35%, 10%)',
  margin: '0 0 16px',
  lineHeight: '1.3',
}
const text = {
  fontSize: '15px',
  color: 'hsl(218, 15%, 40%)',
  lineHeight: '1.6',
  margin: '0 0 28px',
}
const button = {
  backgroundColor: 'hsl(24, 100%, 52%)',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '700' as const,
  borderRadius: '8px',
  padding: '14px 28px',
  textDecoration: 'none',
  display: 'inline-block',
}
const hr = { borderColor: '#e2e8f0', margin: '28px 0 20px' }
const footer = { fontSize: '12px', color: 'hsl(218, 15%, 60%)', margin: '0' }
