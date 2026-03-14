import { Metadata } from 'next';
import MathTugOfWar from './MathTugOfWar';

export const metadata: Metadata = {
  title: 'Math Tug of War | Panda Apps',
  description: 'An interactive two-player math game for kids. Answer questions correctly to pull the rope to your side!',
};

export default function MathTugOfWarPage() {
  return <MathTugOfWar />;
}
