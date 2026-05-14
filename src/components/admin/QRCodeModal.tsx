import { useRef } from 'react'
import QRCode from 'react-qr-code'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, Copy } from 'lucide-react'

interface Props {
  url: string
  onClose: () => void
}

export default function QRCodeModal({ url, onClose }: Props) {
  const qrRef = useRef<HTMLDivElement>(null)

  function copyLink() {
    navigator.clipboard.writeText(url)
  }

  function downloadQR() {
    const svg = qrRef.current?.querySelector('svg')
    if (!svg) return
    const serializer = new XMLSerializer()
    const svgStr = serializer.serializeToString(svg)
    const blob = new Blob([svgStr], { type: 'image/svg+xml' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'tournament-qr.svg'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm text-center">
        <DialogHeader>
          <DialogTitle>Share tournament</DialogTitle>
        </DialogHeader>
        <div ref={qrRef} className="flex justify-center py-4">
          <div className="bg-white p-3 rounded-xl">
            <QRCode value={url} size={180} />
          </div>
        </div>
        <p className="text-xs text-zinc-600 break-all">{url}</p>
        <div className="flex gap-2 justify-center mt-2">
          <Button variant="outline" size="sm" onClick={copyLink}>
            <Copy className="h-3.5 w-3.5 mr-1" /> Copy link
          </Button>
          <Button variant="outline" size="sm" onClick={downloadQR}>
            <Download className="h-3.5 w-3.5 mr-1" /> Download QR
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
