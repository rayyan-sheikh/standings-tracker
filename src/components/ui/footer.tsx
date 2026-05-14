import Logo from './logo'

interface Props {
  color?: 'green' | 'blue'
}

export default function Footer({ color = 'green' }: Props) {
  return (
    <footer className="border-t border-zinc-800/60 px-4 sm:px-6 py-6 mt-4 flex items-center justify-between max-w-3xl mx-auto">
      <p className="text-xs text-zinc-700">© {new Date().getFullYear()} Rayyan Sheikh</p>
      <Logo color={color} className="opacity-40" />
    </footer>
  )
}
