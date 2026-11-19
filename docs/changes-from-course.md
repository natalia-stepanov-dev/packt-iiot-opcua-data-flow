# Changes from the course

The starting point was the code of chapter 6 of the book *Hands-On
Industrial Internet of Things*, 2nd edition
([repository](https://github.com/PacktPublishing/Hands-On-Industrial-Internet-of-Things-Second-Edition),
commit `b6cdf75`). Course 1 of the Coursera specialization
[Hands-On Industrial Internet of Things](https://www.coursera.org/specializations/packt-hands-on-industrial-internet-of-things)
(Foundations of Industrial IoT: Devices, Data Flow, & Security) uses this
code.

| Topic | Course | This project |
|---|---|---|
| Data | sine wave and random values | real data of the machine |
| CPU value | measured its own busy loop (about 100 %) and blocked the server for 1 s per read | measured in the background, a read takes about 2 ms |
| Security | the exercise connects without encryption and as anonymous user, the server allows this | only SignAndEncrypt, user name and password |
| Dependencies | 91 known vulnerabilities | 0 (`npm audit --omit=dev`) |
| NodeIds | some were created automatically, fixed index `ns=1` | fixed NodeIds, own namespace URI |
| Data quality | status is always Good | OPC UA status code, no value if there is no sensor |
| Units | none | engineering units and ranges |
| Write access | a write returned Good, but the value did not change | read-only, a write returns `BadNotWritable` |
| Node-RED | polling every second | subscription |
| Tests | none | unit and integration tests |

## NodeId mapping

| Course | Now |
|---|---|
| `ns=1;s=CPU` | `Gateway.Cpu.Usage` |
| `ns=1;b=1020ffab` | `Gateway.Memory.Usage` |
| `ns=1;s=Temperature` (sine wave) | removed |

## Mistakes in the course material

- The text says the server has three variables. It has four.
- The text says to add code at line 88. The place is marked with the
  comment `// please add measure there`.
- `npm install -g node-red-contrib-opcua` does not install the nodes for
  Node-RED. Use the palette manager or install them in the Node-RED folder.
- The Docker commands have a space in the image name (`nodered/ node-red`)
  and use `docker commit`, which is not needed.
