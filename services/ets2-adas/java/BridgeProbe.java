import java.io.*;
import java.nio.charset.StandardCharsets;

/** Java 8+ example: read actual ETS2 telemetry from the existing local adapter.
 * Never arms or sends driving commands. Run beside ETS2, without server.js.
 * java BridgeProbe <python.exe> <absolute-path-to-bridge.py>
 */
public final class BridgeProbe {
    public static void main(String[] args) throws Exception {
        if (args.length != 2) throw new IllegalArgumentException("python.exe and bridge.py paths required");
        Process bridge = new ProcessBuilder(args[0], args[1]).redirectError(ProcessBuilder.Redirect.INHERIT).start();
        Runtime.getRuntime().addShutdownHook(new Thread(bridge::destroy));
        try (BufferedReader telemetry = new BufferedReader(new InputStreamReader(bridge.getInputStream(), StandardCharsets.UTF_8));
             BufferedWriter commands = new BufferedWriter(new OutputStreamWriter(bridge.getOutputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = telemetry.readLine()) != null) {
                System.out.println(line); // Future: decode Observation, then call your Java policy.
                commands.write("{\"armToken\":0,\"armed\":false,\"steering\":0,\"buttons\":0,\"lateralActive\":false}\n");
                commands.flush();
            }
        } finally { bridge.destroy(); }
    }
}
