interface SocketMonitoringCounters {
  connected: number;
  disconnected: number;
  rejected: number;
  rateLimited: number;
  invalidPayload: number;
  activeConnections: number;
}

interface MonitoringCounters {
  gamesCreated: number;
  gamesFinished: number;
  matchmakingStarted: number;
  matchmakingMatched: number;
  clientErrors: number;
  uncaughtExceptions: number;
  unhandledRejections: number;
  apiRequests: number;
  apiErrors: number;
  activeGames: number;
  requestLatencyMs: number;
  socket: SocketMonitoringCounters;
}

export class MonitoringStore {
  private counters: MonitoringCounters = {
    gamesCreated: 0,
    gamesFinished: 0,
    matchmakingStarted: 0,
    matchmakingMatched: 0,
    clientErrors: 0,
    uncaughtExceptions: 0,
    unhandledRejections: 0,
    apiRequests: 0,
    apiErrors: 0,
    activeGames: 0,
    requestLatencyMs: 0,
    socket: {
      connected: 0,
      disconnected: 0,
      rejected: 0,
      rateLimited: 0,
      invalidPayload: 0,
      activeConnections: 0,
    },
  };

  private latencySamples: number[] = [];
  private readonly MAX_LATENCY_SAMPLES = 100;

  increment(path: string) {
    const parts = path.split('.');
    let target: Record<string, unknown> = this.counters as unknown as Record<string, unknown>;

    for (let index = 0; index < parts.length - 1; index += 1) {
      target = target[parts[index]] as Record<string, unknown>;
    }

    const leaf = parts[parts.length - 1];
    target[leaf] = Number(target[leaf] ?? 0) + 1;
  }

  recordLatency(ms: number) {
    this.latencySamples.push(ms);
    if (this.latencySamples.length > this.MAX_LATENCY_SAMPLES) {
      this.latencySamples.shift();
    }
    // Calculate average
    const sum = this.latencySamples.reduce((a, b) => a + b, 0);
    this.counters.requestLatencyMs = Math.round(sum / this.latencySamples.length);
  }

  setActiveGames(count: number) {
    this.counters.activeGames = count;
  }

  setActiveSocketConnections(count: number) {
    this.counters.socket.activeConnections = count;
  }

  snapshot() {
    return JSON.parse(JSON.stringify(this.counters)) as MonitoringCounters;
  }

  getPrometheusMetrics(): string {
    const c = this.counters;
    const metrics = [
      `# HELP thaichess_games_created Total number of games created`,
      `# TYPE thaichess_games_created counter`,
      `thaichess_games_created ${c.gamesCreated}`,
      ``,
      `# HELP thaichess_games_finished Total number of games finished`,
      `# TYPE thaichess_games_finished counter`,
      `thaichess_games_finished ${c.gamesFinished}`,
      ``,
      `# HELP thaichess_active_games Current number of active games`,
      `# TYPE thaichess_active_games gauge`,
      `thaichess_active_games ${c.activeGames}`,
      ``,
      `# HELP thaichess_api_requests Total number of API requests`,
      `# TYPE thaichess_api_requests counter`,
      `thaichess_api_requests ${c.apiRequests}`,
      ``,
      `# HELP thaichess_api_errors Total number of API errors`,
      `# TYPE thaichess_api_errors counter`,
      `thaichess_api_errors ${c.apiErrors}`,
      ``,
      `# HELP thaichess_request_latency_ms Average request latency in milliseconds`,
      `# TYPE thaichess_request_latency_ms gauge`,
      `thaichess_request_latency_ms ${c.requestLatencyMs}`,
      ``,
      `# HELP thaichess_socket_active_connections Current number of active socket connections`,
      `# TYPE thaichess_socket_active_connections gauge`,
      `thaichess_socket_active_connections ${c.socket.activeConnections}`,
      ``,
      `# HELP thaichess_socket_connected Total number of socket connections`,
      `# TYPE thaichess_socket_connected counter`,
      `thaichess_socket_connected ${c.socket.connected}`,
      ``,
      `# HELP thaichess_socket_disconnected Total number of socket disconnections`,
      `# TYPE thaichess_socket_disconnected counter`,
      `thaichess_socket_disconnected ${c.socket.disconnected}`,
      ``,
      `# HELP thaichess_socket_rate_limited Total number of rate-limited socket events`,
      `# TYPE thaichess_socket_rate_limited counter`,
      `thaichess_socket_rate_limited ${c.socket.rateLimited}`,
      ``,
      `# HELP thaichess_client_errors Total number of client-reported errors`,
      `# TYPE thaichess_client_errors counter`,
      `thaichess_client_errors ${c.clientErrors}`,
    ].join('\n');

    return metrics;
  }
}
