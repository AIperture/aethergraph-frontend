import * as React from "react";
import { useParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";

const RunWorkspacePage: React.FC = () => {
  const { runId } = useParams<{ runId: string }>();
  const [tab, setTab] = React.useState("overview");

  return (
    <div className="h-full px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-sm font-semibold text-foreground">
            Run workspace
          </h1>
          <p className="text-xs text-muted-foreground">
            Run ID: <span className="font-mono">{runId ?? "unknown"}</span>
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="h-[calc(100%-2.5rem)] flex flex-col">
        <TabsList className="w-full justify-start mb-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="artifacts">Artifacts</TabsTrigger>
          <TabsTrigger value="memory">Memory</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
        </TabsList>

        <div className="flex-1">
          <TabsContent value="overview" className="h-full">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-sm">Overview (mock)</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Status, metrics, config, and mini timeline will go here.
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="artifacts" className="h-full">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-sm">Artifacts (mock)</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Table of files/plots produced by this run.
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="memory" className="h-full">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-sm">Memory (mock)</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Session events & long-term summaries for this scope.
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat" className="h-full">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-sm">Chat (mock)</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Channel messages for this run or linked scope.
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default RunWorkspacePage;
