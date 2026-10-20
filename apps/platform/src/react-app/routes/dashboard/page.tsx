import { Button, Card, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { Link } from "react-router";

const sections = [
  { title: "Courses", description: "Access training and follow your learning progress.", to: "/dashboard/courses" },
  { title: "Organizations", description: "Manage your organizations and employee training.", to: "/dashboard/organizations" },
  { title: "Orders", description: "Review purchases and order details.", to: "/dashboard/orders" },
];

export default function DashboardPage() {
  return (
    <Stack gap="lg">
      <div>
        <Title order={1} size="h2">Overview</Title>
        <Text c="dimmed" mt="xs">Your training and account, in one place.</Text>
      </div>
      <SimpleGrid cols={{ base: 1, md: 3 }}>
        {sections.map(({ title, description, to }) => (
          <Card key={to} withBorder padding="lg">
            <Stack h="100%" align="flex-start">
              <Title order={2} size="h4">{title}</Title>
              <Text c="dimmed" style={{ flexGrow: 1 }}>{description}</Text>
              <Button component={Link} to={to} variant="light">View {title.toLowerCase()}</Button>
            </Stack>
          </Card>
        ))}
      </SimpleGrid>
    </Stack>
  );
}
