import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import ChecklistRtlOutlinedIcon from '@mui/icons-material/ChecklistRtlOutlined'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined'
import { Link as RouterLink, useLocation, useParams } from 'react-router-dom'

type LocationState = {
  title?: string
  status?: string
}

export default function ListingSubmittedPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const state = (location.state ?? {}) as LocationState

  return (
    <Paper
      sx={{
        maxWidth: 860,
        mx: 'auto',
        p: { xs: 2.5, md: 5 },
        borderRadius: 3,
        border: '1px solid rgba(82,226,111,0.18)',
        background:
          'linear-gradient(145deg, rgba(82,226,111,0.12), rgba(20,29,39,0.92) 42%, rgba(12,17,24,0.96))',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 'auto -120px -180px auto',
          width: 360,
          height: 360,
          borderRadius: '50%',
          bgcolor: 'rgba(82,226,111,0.08)',
          filter: 'blur(6px)',
        }}
      />

      <Stack spacing={3} sx={{ position: 'relative' }}>
        <Box
          sx={{
            width: 76,
            height: 76,
            borderRadius: 3,
            display: 'grid',
            placeItems: 'center',
            bgcolor: 'rgba(82,226,111,0.14)',
            color: 'primary.main',
            border: '1px solid rgba(82,226,111,0.28)',
          }}
        >
          <PendingActionsOutlinedIcon sx={{ fontSize: 42 }} />
        </Box>

        <Box>
          <Stack direction="row" spacing={1} sx={{ mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
            <Chip color="primary" label="Отправлено" sx={{ fontWeight: 900 }} />
            <Chip variant="outlined" label={state.status ?? 'PendingModeration'} sx={{ fontWeight: 800 }} />
          </Stack>
          <Typography variant="h3" fontWeight={950} sx={{ mb: 1 }}>
            Объявление отправлено на модерацию
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: 18, maxWidth: 680 }}>
            Мы сохранили товар и передали его на проверку. После одобрения модератором объявление появится в каталоге и станет доступно покупателям.
          </Typography>
        </Box>

        {state.title && (
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.035)',
              borderColor: 'rgba(255,255,255,0.1)',
            }}
          >
            <Typography color="text.secondary" variant="body2" sx={{ mb: 0.5 }}>
              Название объявления
            </Typography>
            <Typography fontWeight={900}>{state.title}</Typography>
          </Paper>
        )}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: 1.5,
          }}
        >
          {[
            ['1', 'Проверка', 'Модератор проверит название, описание, цену и изображения.'],
            ['2', 'Решение', 'Если всё нормально, товар получит статус Active.'],
            ['3', 'Продажи', 'После одобрения покупатели смогут увидеть товар в каталоге.'],
          ].map(([step, title, text]) => (
            <Paper key={step} sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.04)' }}>
              <Typography color="primary" fontWeight={950} sx={{ mb: 0.75 }}>
                Шаг {step}
              </Typography>
              <Typography fontWeight={900}>{title}</Typography>
              <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
                {text}
              </Typography>
            </Paper>
          ))}
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <Button
            component={RouterLink}
            to="/my-listings"
            variant="contained"
            size="large"
            startIcon={<Inventory2OutlinedIcon />}
          >
            Перейти в мои товары
          </Button>
          <Button
            component={RouterLink}
            to="/my-listings/create"
            variant="outlined"
            size="large"
            startIcon={<AddCircleOutlineIcon />}
          >
            Создать ещё
          </Button>
          {id && (
            <Button
              component={RouterLink}
              to={`/my-listings/${id}/edit`}
              variant="text"
              size="large"
              startIcon={<ChecklistRtlOutlinedIcon />}
            >
              Редактировать
            </Button>
          )}
        </Stack>
      </Stack>
    </Paper>
  )
}
