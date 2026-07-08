import { Box, Pagination } from '@mui/material'

interface Props {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

export default function PaginationBar({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
      <Pagination count={totalPages} page={page} onChange={(_, p) => onChange(p)} color="primary" />
    </Box>
  )
}
