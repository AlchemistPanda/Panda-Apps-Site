import RegistrationFormClient from "./components/RegistrationFormClient";

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return <RegistrationFormClient sessionId={sessionId} />;
}
