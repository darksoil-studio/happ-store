use happs_integrity::*;
use hdk::prelude::*;

#[hdk_extern]
pub fn create_happ_release(happ_release: HappRelease) -> ExternResult<Record> {
    let happ_release_hash = create_entry(&EntryTypes::HappRelease(happ_release.clone()))?;
    create_link(
        happ_release.happ_hash.clone(),
        happ_release_hash.clone(),
        LinkTypes::HappToHappReleases,
        (),
    )?;
    let record = get(happ_release_hash.clone(), GetOptions::default())?.ok_or(wasm_error!(
        WasmErrorInner::Guest("Could not find the newly created HappRelease".to_string())
    ))?;
    Ok(record)
}

#[hdk_extern]
pub fn get_latest_happ_release(
    original_happ_release_hash: ActionHash,
) -> ExternResult<Option<Record>> {
    let links = get_links(
        GetLinksInputBuilder::try_new(
            original_happ_release_hash.clone(),
            LinkTypes::HappReleaseUpdates,
        )?
        .build(),
    )?;
    let latest_link = links
        .into_iter()
        .max_by(|link_a, link_b| link_a.timestamp.cmp(&link_b.timestamp));
    let latest_happ_release_hash = match latest_link {
        Some(link) => {
            link.target
                .clone()
                .into_action_hash()
                .ok_or(wasm_error!(WasmErrorInner::Guest(
                    "No action hash associated with link".to_string()
                )))?
        }
        None => original_happ_release_hash.clone(),
    };
    get(latest_happ_release_hash, GetOptions::default())
}

#[hdk_extern]
pub fn get_original_happ_release(
    original_happ_release_hash: ActionHash,
) -> ExternResult<Option<Record>> {
    let Some(details) = get_details(original_happ_release_hash, GetOptions::default())? else {
        return Ok(None);
    };
    match details {
        Details::Record(details) => Ok(Some(details.record)),
        _ => Err(wasm_error!(WasmErrorInner::Guest(
            "Malformed get details response".to_string()
        ))),
    }
}

#[hdk_extern]
pub fn get_all_revisions_for_happ_release(
    original_happ_release_hash: ActionHash,
) -> ExternResult<Vec<Record>> {
    let Some(original_record) = get_original_happ_release(original_happ_release_hash.clone())?
    else {
        return Ok(vec![]);
    };
    let links = get_links(
        GetLinksInputBuilder::try_new(
            original_happ_release_hash.clone(),
            LinkTypes::HappReleaseUpdates,
        )?
        .build(),
    )?;
    let get_input: Vec<GetInput> = links
        .into_iter()
        .map(|link| {
            Ok(GetInput::new(
                link.target
                    .into_action_hash()
                    .ok_or(wasm_error!(WasmErrorInner::Guest(
                        "No action hash associated with link".to_string()
                    )))?
                    .into(),
                GetOptions::default(),
            ))
        })
        .collect::<ExternResult<Vec<GetInput>>>()?;
    let records = HDK.with(|hdk| hdk.borrow().get(get_input))?;
    let mut records: Vec<Record> = records.into_iter().flatten().collect();
    records.insert(0, original_record);
    Ok(records)
}

#[derive(Serialize, Deserialize, Debug)]
pub struct UpdateHappReleaseInput {
    pub original_happ_release_hash: ActionHash,
    pub previous_happ_release_hash: ActionHash,
    pub updated_happ_release: HappRelease,
}

#[hdk_extern]
pub fn update_happ_release(input: UpdateHappReleaseInput) -> ExternResult<Record> {
    let updated_happ_release_hash = update_entry(
        input.previous_happ_release_hash.clone(),
        &input.updated_happ_release,
    )?;
    create_link(
        input.original_happ_release_hash.clone(),
        updated_happ_release_hash.clone(),
        LinkTypes::HappReleaseUpdates,
        (),
    )?;
    let record =
        get(updated_happ_release_hash.clone(), GetOptions::default())?.ok_or(wasm_error!(
            WasmErrorInner::Guest("Could not find the newly updated HappRelease".to_string())
        ))?;
    Ok(record)
}

#[hdk_extern]
pub fn get_happ_releases_for_happ(happ_hash: ActionHash) -> ExternResult<Vec<Link>> {
    get_links(GetLinksInputBuilder::try_new(happ_hash, LinkTypes::HappToHappReleases)?.build())
}
