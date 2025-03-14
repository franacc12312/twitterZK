// Twitter Account Verification Circuit
// This circuit verifies that:
// 1. The Twitter account and Ethereum wallet are associated (via signature)
// 2. The Twitter account is older than 150 days
// 3. The Twitter account has more than 150 followers

use dep::ecrecover;

// Main function that takes private inputs and returns a public output
fn main(
    twitter_id_hash: Field,      // Hash of the Twitter ID (private input)
    antiquity_days: Field,       // Account age in days (private input)
    followers: Field,            // Number of followers (private input)
    message_hash: pub Field,     // Hash of the message that was signed (public input)
    pub_key_x: pub Field,        // X coordinate of the public key (public input)
    pub_key_y: pub Field,        // Y coordinate of the public key (public input)
    signature_r: Field,          // R component of the signature
    signature_s: Field,          // S component of the signature
    signature_v: Field           // V component of the signature (recovery id)
) -> pub Field {
    // Verify that the account is older than 150 days
    assert antiquity_days > 150;
    
    // Verify that the account has more than 150 followers
    assert followers > 150;
    
    // Verify the ECDSA signature using ecrecover
    let recovered_pub_key = ecrecover::recover(
        message_hash,
        signature_r,
        signature_s,
        signature_v
    );
    
    // Verify that the recovered public key matches the provided public key
    assert recovered_pub_key.x == pub_key_x;
    assert recovered_pub_key.y == pub_key_y;
    
    // Return 1 to indicate successful verification
    1
} 