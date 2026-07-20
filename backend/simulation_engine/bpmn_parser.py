from lxml import etree

NS = {"bpmn": "http://www.omg.org/spec/BPMN/20100524/MODEL"}

# All BPMN elements that represent an executable activity. Modelers like
# Camunda/Signavio export specialized task types (userTask, serviceTask, ...)
# instead of the plain "task" element.
TASK_TAGS = [
    "task",
    "userTask",
    "serviceTask",
    "sendTask",
    "receiveTask",
    "manualTask",
    "businessRuleTask",
    "scriptTask",
    "callActivity",
    "subProcess",
]

# Routing elements we pass through when resolving transitions.
GATEWAY_TAGS = [
    "exclusiveGateway",
    "parallelGateway",
    "inclusiveGateway",
    "eventBasedGateway",
    "complexGateway",
    "intermediateCatchEvent",
    "intermediateThrowEvent",
]


def iter_tasks(root):
    for tag in TASK_TAGS:
        yield from root.iter(f"{{{NS['bpmn']}}}{tag}")


def extract_roles(root) -> dict:
    id_to_name = {}
    for task in iter_tasks(root):
        id_to_name[task.get("id")] = task.get("name")

    roles = {}
    for lane in root.iter(f"{{{NS['bpmn']}}}lane"):
        role_name = lane.get("name")
        task_names = []
        for ref in lane.findall("bpmn:flowNodeRef", NS):
            node_id = ref.text
            if node_id in id_to_name:
                task_names.append(id_to_name[node_id])
        roles[role_name] = task_names

    return roles


def extract_raw_flow(root) -> dict:
    flow = {}
    for seq in root.iter(f"{{{NS['bpmn']}}}sequenceFlow"):
        source = seq.get("sourceRef")
        target = seq.get("targetRef")
        flow.setdefault(source, []).append(target)
    return flow


def build_node_info(root) -> dict:
    info = {}
    for task in iter_tasks(root):
        info[task.get("id")] = {"kind": "task", "name": task.get("name")}
    for tag in GATEWAY_TAGS:
        for gw in root.iter(f"{{{NS['bpmn']}}}{tag}"):
            info[gw.get("id")] = {"kind": "gateway", "name": gw.get("name")}
    for ev in root.iter(f"{{{NS['bpmn']}}}startEvent"):
        info[ev.get("id")] = {"kind": "start", "name": ev.get("name")}
    for ev in root.iter(f"{{{NS['bpmn']}}}endEvent"):
        info[ev.get("id")] = {"kind": "end", "name": ev.get("name")}
    return info


def resolve_targets(node_id, raw_flow, node_info, _visited=None) -> list:
    # Guard against gateway loops in the model.
    if _visited is None:
        _visited = set()
    if node_id in _visited:
        return []
    _visited.add(node_id)

    node = node_info.get(node_id)

    # Unknown element (boundary event, data object, ...): follow its outgoing
    # flows transparently instead of crashing.
    if node is None:
        results = []
        for next_id in raw_flow.get(node_id, []):
            results.extend(resolve_targets(next_id, raw_flow, node_info, _visited))
        return results

    kind = node["kind"]

    if kind == "task":
        return [node["name"]]

    if kind == "end":
        return ["END"]

    if kind == "gateway":
        results = []
        for next_id in raw_flow.get(node_id, []):
            results.extend(resolve_targets(next_id, raw_flow, node_info, _visited))
        return results

    return []


def extract_transitions(root) -> dict:
    raw_flow = extract_raw_flow(root)
    node_info = build_node_info(root)

    transitions = {}
    for source_id, target_ids in raw_flow.items():
        source = node_info.get(source_id)
        if not source:
            continue

        if source["kind"] == "start":
            source_name = "START"
        elif source["kind"] == "task":
            source_name = source["name"]
        else:
            continue

        resolved = []
        for target_id in target_ids:
            resolved.extend(resolve_targets(target_id, raw_flow, node_info))

        transitions[source_name] = resolved

    return transitions


def extract_terminals(root) -> list:
    raw_flow = extract_raw_flow(root)
    node_info = build_node_info(root)

    terminals = []
    for source_id, target_ids in raw_flow.items():
        source = node_info.get(source_id)
        if not source or source["kind"] != "task":
            continue

        for target_id in target_ids:
            target = node_info.get(target_id)
            if target and target["kind"] == "end":
                terminals.append(source["name"])
                break

    return terminals


def get_allowed_next_actions(transitions: dict, last_action) -> list:
    # If nothing happened yet, return what comes after START
    if last_action is None:
        return transitions.get("START", [])
    # Otherwise return what comes after the last action
    return transitions.get(last_action, [])


def parse_bpmn(file_path: str) -> dict:
    tree = etree.parse(file_path)
    root = tree.getroot()

    return {
        "roles": extract_roles(root),
        "transitions": extract_transitions(root),
        "terminal_actions": extract_terminals(root),
    }


if __name__ == "__main__":
    import json
    result = parse_bpmn("examples/payment.bpmn")
    print(json.dumps(result, indent=2))

    t = result["transitions"]
    print("\n--- allowed next actions ---")
    print("At start:", get_allowed_next_actions(t, None))
    print("After Check Request:", get_allowed_next_actions(t, "Check Request"))
    print("After Approve Request:", get_allowed_next_actions(t, "Approve Request"))
    print("After Handle Payment:", get_allowed_next_actions(t, "Handle Payment"))
