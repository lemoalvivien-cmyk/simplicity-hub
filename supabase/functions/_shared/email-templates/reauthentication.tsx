/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Votre code de vérification WIINUP MAX</Preview>
    <Body style={main}>
      <Container style={container}>
        <div style={header}>
          <Text style={logoText}>WIINUP MAX</Text>
        </div>
        <div style={content}>
          <Heading style={h1}>Code de vérification</Heading>
          <Text style={text}>
            Utilisez le code ci-dessous pour confirmer votre identité :
          </Text>
          <div style={codeBox}>
            <Text style={codeStyle}>{token}</Text>
          </div>
          <Hr style={hr} />
          <Text style={footer}>
            Ce code expire dans quelques minutes. Si vous n'avez pas fait cette
            demande, ignorez cet email.
          </Text>
        </div>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

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
  margin: '0 0 20px',
}
const codeBox = {
  backgroundColor: 'hsl(218, 22%, 93%)',
  borderRadius: '8px',
  padding: '20px',
  textAlign: 'center' as const,
  margin: '0 0 24px',
}
const codeStyle = {
  fontFamily: '"Courier New", Courier, monospace',
  fontSize: '32px',
  fontWeight: '800' as const,
  color: 'hsl(218, 72%, 18%)',
  margin: '0',
  letterSpacing: '6px',
}
const hr = { borderColor: '#e2e8f0', margin: '8px 0 20px' }
const footer = { fontSize: '12px', color: 'hsl(218, 15%, 60%)', margin: '0' }
