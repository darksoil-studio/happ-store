use happs_integrity::*;
use hdk::prelude::*;

#[hdk_extern]
pub fn unpublish_happ(happ_hash: ActionHash) -> ExternResult<()> {
    create_link(happ_hash.clone(), happ_hash, LinkTypes::HappUnpublished, ())?;
    Ok(())
}

#[hdk_extern]
pub fn get_happ_unpublished_links(happ_hash: ActionHash) -> ExternResult<Vec<Link>> {
    let links =
        get_links(GetLinksInputBuilder::try_new(happ_hash, LinkTypes::HappUnpublished)?.build())?;
    Ok(links)
}

#[hdk_extern]
pub fn republish_happ(happ_hash: ActionHash) -> ExternResult<()> {
    let links = get_happ_unpublished_links(happ_hash)?;

    if links.len() == 0 {
        return Err(wasm_error!("App is not unpublished."));
    }

    for link in links {
        delete_link(link.create_link_hash)?;
    }

    Ok(())
}
