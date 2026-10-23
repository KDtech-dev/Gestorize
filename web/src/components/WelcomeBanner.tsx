import Image from 'next/image';
import { Box, Stack, Typography } from '@mui/material';

export function WelcomeBanner() {
  return (
    <Box
      component="section"
      sx={{
        position: 'relative',
        minHeight: { xs: 230, md: 248 },
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        p: { xs: '23px 19px', md: '34px 38px' },
        borderRadius: { xs: '16px', md: '20px' },
        color: '#fff',
        background: 'linear-gradient(112deg,#062046 0%,#005CE4 58%,#1268d3 100%)',
        boxShadow: '0 15px 40px #0048b824',
        '&::after': {
          content: '""', position: 'absolute', width: 390, height: 390,
          border: '1px solid #ffffff15', borderRadius: '50%', right: -112, top: -175,
          boxShadow: '0 0 0 28px #ffffff08,0 0 0 58px #ffffff06',
        },
      }}
    >
      <Stack spacing={0} sx={{ position: 'relative', zIndex: 1, maxWidth: { xs: 'calc(100% - 58px)', md: 'calc(100% - 175px)' } }}>
        <Typography component="span" sx={{ color: '#e6e3dd', fontSize: { xs: 11, md: 13 }, fontWeight: 800, letterSpacing: { xs: 1, md: 1.45 } }}>
          SEU NEGÓCIO EM FOCO
        </Typography>
        <Typography component="h1" sx={{ maxWidth: 760, mt: '12px', mb: '9px', font: '800 clamp(27px,3.2vw,42px)/1.18 Manrope,sans-serif', letterSpacing: '-1.2px' }}>
          Gestão simples, decisões melhores.
        </Typography>
        <Typography component="p" sx={{ maxWidth: 680, m: 0, color: '#dbeafe', fontSize: { xs: 14, md: 16 }, lineHeight: 1.55 }}>
          Acompanhe os principais indicadores e acesse seus módulos.
        </Typography>
      </Stack>
      <Box
        aria-hidden="true"
        sx={{
          position: 'absolute', zIndex: 1, right: { xs: 13, md: 70 }, top: { xs: 'auto', md: 38 }, bottom: { xs: 18, md: 'auto' },
          width: { xs: 64, md: 118 }, height: { xs: 64, md: 118 }, display: 'grid', placeItems: 'center',
          border: '1px solid #ffffff50', borderRadius: { xs: '19px', md: '34px' }, transform: 'rotate(-8deg)',
          boxShadow: 'inset 0 1px 14px #ffffff20',
        }}
      >
        <Image src="/images/LogoLight.png" alt="" width={92} height={78} priority style={{ width: '78%', height: '66%', objectFit: 'contain' }} />
      </Box>
    </Box>
  );
}
